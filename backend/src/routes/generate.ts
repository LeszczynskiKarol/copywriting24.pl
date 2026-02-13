import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { generateText, generateTextStreamWithMetrics } from "../services/textGenerator.js";

const prisma = new PrismaClient();
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT || "3");
const ALLOWED_LENGTHS = [1000, 2000, 3000];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Zod Schemas
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GenerateSchema = z.object({
  topic: z.string().min(3).max(500),
  length: z.number().refine((val) => ALLOWED_LENGTHS.includes(val)),
  keywords: z.array(z.string().max(60)).max(5).default([]),
  fingerprint: z.string().min(8).max(128),
});

const LimitStatusSchema = z.object({
  fingerprint: z.string().min(8).max(128),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getStartOfDay(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return request.ip || "unknown";
}

function getRequestMeta(request: FastifyRequest) {
  return {
    userAgent: (request.headers["user-agent"] || "").substring(0, 500),
    referer: (request.headers["referer"] || request.headers["origin"] || "").substring(0, 500),
    acceptLang: (request.headers["accept-language"] || "").substring(0, 200),
  };
}

async function checkRateLimit(fingerprint: string, ip: string) {
  const startOfDay = getStartOfDay();
  const resetAt = new Date(startOfDay);
  resetAt.setDate(resetAt.getDate() + 1);

  const [fpCount, ipCount, override] = await Promise.all([
    prisma.generation.count({ where: { fingerprint, createdAt: { gte: startOfDay } } }),
    prisma.generation.count({ where: { ip, createdAt: { gte: startOfDay } } }),
    prisma.userLimitOverride.findUnique({ where: { ip } }).catch(() => null),
  ]);

  const bonus = override?.bonusToday || 0;
  const effectiveLimit = DAILY_LIMIT + bonus;
  const usedCount = Math.max(fpCount, ipCount);

  return {
    allowed: usedCount < effectiveLimit,
    remaining: Math.max(0, effectiveLimit - usedCount),
    effectiveLimit,
    bonus,
    resetAt,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default async function generateRoutes(fastify: FastifyInstance) {

  // ─── POST /api/generate (non-streaming) ───
  fastify.post("/api/generate", async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = GenerateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Błąd walidacji", details: parseResult.error.issues.map((i) => i.message) });
    }

    const { topic, length, keywords, fingerprint } = parseResult.data;
    const ip = getClientIp(request);
    const meta = getRequestMeta(request);

    const limit = await checkRateLimit(fingerprint, ip);
    if (!limit.allowed) {
      return reply.status(429).send({ error: "Wykorzystano dzienny limit generacji", remaining: 0, resetAt: limit.resetAt.toISOString() });
    }

    // Create pending record
    const record = await prisma.generation.create({
      data: { fingerprint, ip, topic, length, keywords: keywords.length > 0 ? JSON.stringify(keywords) : null, status: "generating", ...meta },
    });

    try {
      const metrics = await generateText({ topic, length, keywords });

      await prisma.generation.update({
        where: { id: record.id },
        data: {
          status: "completed",
          result: metrics.result,
          resultLength: metrics.resultLength,
          plainLength: metrics.plainLength,
          model: metrics.model,
          inputTokens: metrics.inputTokens,
          outputTokens: metrics.outputTokens,
          totalTokens: metrics.totalTokens,
          costUsd: metrics.costUsd,
          latencyMs: metrics.latencyMs,
          stopReason: metrics.stopReason,
          promptLength: metrics.promptLength,
          completedAt: new Date(),
        },
      });

      const newLimit = await checkRateLimit(fingerprint, ip);
      return reply.send({ success: true, result: metrics.result, length: metrics.resultLength, remaining: newLimit.remaining, resetAt: newLimit.resetAt.toISOString() });
    } catch (error: any) {
      await prisma.generation.update({
        where: { id: record.id },
        data: { status: "error", errorMessage: error.message?.substring(0, 1000) },
      });
      return reply.status(500).send({ error: "Błąd generowania tekstu. Spróbuj ponownie." });
    }
  });

  // ─── POST /api/generate/stream (SSE) ───
  fastify.post("/api/generate/stream", async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = GenerateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: "Błąd walidacji", details: parseResult.error.issues.map((i) => i.message) });
    }

    const { topic, length, keywords, fingerprint } = parseResult.data;
    const ip = getClientIp(request);
    const meta = getRequestMeta(request);

    const limit = await checkRateLimit(fingerprint, ip);
    if (!limit.allowed) {
      return reply.status(429).send({ error: "Wykorzystano dzienny limit generacji", remaining: 0, resetAt: limit.resetAt.toISOString() });
    }

    const record = await prisma.generation.create({
      data: { fingerprint, ip, topic, length, keywords: keywords.length > 0 ? JSON.stringify(keywords) : null, status: "generating", ...meta },
    });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
    });

    try {
      const metrics = await generateTextStreamWithMetrics({
        topic, length, keywords,
        onChunk: (text) => {
          reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`);
        },
      });

      await prisma.generation.update({
        where: { id: record.id },
        data: {
          status: "completed",
          result: metrics.result,
          resultLength: metrics.resultLength,
          plainLength: metrics.plainLength,
          model: metrics.model,
          inputTokens: metrics.inputTokens,
          outputTokens: metrics.outputTokens,
          totalTokens: metrics.totalTokens,
          costUsd: metrics.costUsd,
          latencyMs: metrics.latencyMs,
          stopReason: metrics.stopReason,
          promptLength: metrics.promptLength,
          completedAt: new Date(),
        },
      });

      const newLimit = await checkRateLimit(fingerprint, ip);
      reply.raw.write(`data: ${JSON.stringify({ done: true, remaining: newLimit.remaining, resetAt: newLimit.resetAt.toISOString() })}\n\n`);
    } catch (error: any) {
      await prisma.generation.update({
        where: { id: record.id },
        data: { status: "error", errorMessage: error.message?.substring(0, 1000) },
      });
      reply.raw.write(`data: ${JSON.stringify({ error: "Błąd generowania tekstu" })}\n\n`);
    }

    reply.raw.end();
  });

  // ─── GET /api/limit-status ───
  fastify.get("/api/limit-status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { fingerprint } = LimitStatusSchema.parse(request.query);
      const ip = getClientIp(request);
      const limit = await checkRateLimit(fingerprint, ip);
      return reply.send({ remaining: limit.remaining, total: limit.effectiveLimit, resetAt: limit.resetAt.toISOString() });
    } catch {
      return reply.status(400).send({ error: "Brakuje fingerprint" });
    }
  });

  fastify.get("/api/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
}
