import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 Admin auth middleware
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  const token =
    request.headers["x-admin-token"] || (request.query as any)?.token;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return reply.status(500).send({ error: "ADMIN_TOKEN not configured" });
  }
  if (token !== adminToken) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {
  // Auth on all admin routes
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/api/admin")) {
      verifyAdmin(request, reply);
    }
  });

  // ─── GET /api/admin/dashboard ───────────────────────────────
  // Main dashboard: overall stats, today's stats, cost summary
  fastify.get(
    "/api/admin/dashboard",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        totalCount,
        todayCount,
        weekCount,
        monthCount,
        errorCount,
        todayErrors,
        costAgg,
        todayCostAgg,
        weekCostAgg,
        monthCostAgg,
        todayUniqueIps,
        todayUniqueFingerprints,
        totalUniqueIps,
        avgLatency,
        todayAvgLatency,
        tokenAgg,
        lengthDistribution,
        recentGenerations,
      ] = await Promise.all([
        prisma.generation.count(),
        prisma.generation.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.generation.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.generation.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
        prisma.generation.count({ where: { status: "error" } }),
        prisma.generation.count({
          where: { status: "error", createdAt: { gte: startOfDay } },
        }),
        prisma.generation.aggregate({ _sum: { costUsd: true } }),
        prisma.generation.aggregate({
          _sum: { costUsd: true },
          where: { createdAt: { gte: startOfDay } },
        }),
        prisma.generation.aggregate({
          _sum: { costUsd: true },
          where: { createdAt: { gte: startOfWeek } },
        }),
        prisma.generation.aggregate({
          _sum: { costUsd: true },
          where: { createdAt: { gte: startOfMonth } },
        }),

        prisma.generation
          .groupBy({ by: ["ip"], where: { createdAt: { gte: startOfDay } } })
          .then((r) => r.length),
        prisma.generation
          .groupBy({
            by: ["fingerprint"],
            where: { createdAt: { gte: startOfDay } },
          })
          .then((r) => r.length),
        prisma.generation.groupBy({ by: ["ip"] }).then((r) => r.length),

        prisma.generation.aggregate({
          _avg: { latencyMs: true },
          where: { status: "completed" },
        }),
        prisma.generation.aggregate({
          _avg: { latencyMs: true },
          where: { status: "completed", createdAt: { gte: startOfDay } },
        }),
        prisma.generation.aggregate({
          _sum: { inputTokens: true, outputTokens: true, totalTokens: true },
        }),

        prisma.generation.groupBy({
          by: ["length"],
          _count: true,
          orderBy: { length: "asc" },
        }),

        prisma.generation.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            ip: true,
            fingerprint: true,
            topic: true,
            length: true,
            status: true,
            resultLength: true,
            plainLength: true,
            costUsd: true,
            latencyMs: true,
            inputTokens: true,
            outputTokens: true,
            stopReason: true,
            createdAt: true,
            errorMessage: true,
            userAgent: true,
          },
        }),
      ]);

      return reply.send({
        overview: {
          totalGenerations: totalCount,
          todayGenerations: todayCount,
          weekGenerations: weekCount,
          monthGenerations: monthCount,
          totalErrors: errorCount,
          todayErrors,
          errorRate:
            totalCount > 0
              ? ((errorCount / totalCount) * 100).toFixed(1) + "%"
              : "0%",
        },
        users: {
          todayUniqueIps,
          todayUniqueFingerprints,
          totalUniqueIps,
        },
        costs: {
          totalUsd: costAgg._sum.costUsd || 0,
          todayUsd: todayCostAgg._sum.costUsd || 0,
          weekUsd: weekCostAgg._sum.costUsd || 0,
          monthUsd: monthCostAgg._sum.costUsd || 0,
          totalPln: ((costAgg._sum.costUsd || 0) * 4.05).toFixed(2),
          monthPln: ((monthCostAgg._sum.costUsd || 0) * 4.05).toFixed(2),
        },
        performance: {
          avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
          todayAvgLatencyMs: Math.round(todayAvgLatency._avg.latencyMs || 0),
        },
        tokens: {
          totalInput: tokenAgg._sum.inputTokens || 0,
          totalOutput: tokenAgg._sum.outputTokens || 0,
          total: tokenAgg._sum.totalTokens || 0,
        },
        lengthDistribution: lengthDistribution.map((d) => ({
          length: d.length,
          count: d._count,
        })),
        recentGenerations,
      });
    },
  );

  // ─── GET /api/admin/generations ─────────────────────────────
  // Paginated list with filters
  fastify.get(
    "/api/admin/generations",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 25));
      const skip = (page - 1) * limit;
      const status = query.status || undefined;
      const ip = query.ip || undefined;
      const fingerprint = query.fingerprint || undefined;
      const search = query.search || undefined;
      const sortBy = query.sortBy || "createdAt";
      const sortDir = query.sortDir === "asc" ? "asc" : "desc";
      const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
      const dateTo = query.dateTo ? new Date(query.dateTo) : undefined;

      const where: any = {};
      if (status) where.status = status;
      if (ip) where.ip = ip;
      if (fingerprint) where.fingerprint = fingerprint;
      if (search) where.topic = { contains: search, mode: "insensitive" };
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const validSortFields = [
        "createdAt",
        "latencyMs",
        "costUsd",
        "resultLength",
        "length",
        "totalTokens",
      ];
      const orderField = validSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";

      const [generations, total] = await Promise.all([
        prisma.generation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderField]: sortDir },
          select: {
            id: true,
            ip: true,
            fingerprint: true,
            topic: true,
            length: true,
            status: true,
            resultLength: true,
            plainLength: true,
            costUsd: true,
            latencyMs: true,
            inputTokens: true,
            outputTokens: true,
            totalTokens: true,
            stopReason: true,
            model: true,
            createdAt: true,
            completedAt: true,
            errorMessage: true,
            userAgent: true,
            referer: true,
            acceptLang: true,
            keywords: true,
          },
        }),
        prisma.generation.count({ where }),
      ]);

      return reply.send({
        generations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    },
  );

  // ─── GET /api/admin/generation/:id ──────────────────────────
  // Full detail of single generation (incl. result text)
  fastify.get(
    "/api/admin/generation/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      const generation = await prisma.generation.findUnique({ where: { id } });
      if (!generation) return reply.status(404).send({ error: "Not found" });
      return reply.send(generation);
    },
  );

  // ─── GET /api/admin/users ──────────────────────────────────
  // Unique users grouped by IP with stats
  fastify.get(
    "/api/admin/users",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as any;
      const page = Math.max(1, parseInt(query.page) || 1);
      const limit = Math.min(100, parseInt(query.limit) || 25);
      const search = query.search || undefined;

      // Raw SQL for grouping by IP with aggregates
      const users = await prisma.$queryRawUnsafe<any[]>(
        `
      SELECT
        ip,
        fingerprint,
        COUNT(*) as total_generations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
        COALESCE(SUM("costUsd"), 0) as total_cost,
        COALESCE(SUM("totalTokens"), 0) as total_tokens,
        COALESCE(AVG("latencyMs"), 0) as avg_latency,
        MIN("createdAt") as first_seen,
        MAX("createdAt") as last_seen,
        COUNT(CASE WHEN "createdAt" >= CURRENT_DATE THEN 1 END) as today_count
      FROM "Generation"
      ${search ? `WHERE ip LIKE '%' || $3 || '%' OR topic ILIKE '%' || $3 || '%'` : ""}
      GROUP BY ip, fingerprint
      ORDER BY MAX("createdAt") DESC
      LIMIT $1 OFFSET $2
    `,
        limit,
        (page - 1) * limit,
        ...(search ? [search] : []),
      );

      const totalResult = await prisma.$queryRawUnsafe<any[]>(
        `
      SELECT COUNT(DISTINCT ip) as count FROM "Generation"
      ${search ? `WHERE ip LIKE '%' || $1 || '%' OR topic ILIKE '%' || $1 || '%'` : ""}
    `,
        ...(search ? [search] : []),
      );

      const total = Number(totalResult[0]?.count || 0);

      return reply.send({
        users: users.map((u) => ({
          ...u,
          total_generations: Number(u.total_generations),
          completed: Number(u.completed),
          errors: Number(u.errors),
          total_cost: Number(u.total_cost),
          total_tokens: Number(u.total_tokens),
          avg_latency: Math.round(Number(u.avg_latency)),
          today_count: Number(u.today_count),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    },
  );

  // ─── GET /api/admin/user/:ip ───────────────────────────────
  // All generations for a specific IP
  fastify.get(
    "/api/admin/user/:ip",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ip } = request.params as any;
      const generations = await prisma.generation.findMany({
        where: { ip },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          fingerprint: true,
          topic: true,
          length: true,
          keywords: true,
          status: true,
          resultLength: true,
          plainLength: true,
          costUsd: true,
          latencyMs: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          stopReason: true,
          model: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
          userAgent: true,
          referer: true,
          acceptLang: true,
        },
      });

      const stats = await prisma.generation.aggregate({
        where: { ip },
        _count: true,
        _sum: { costUsd: true, totalTokens: true },
        _avg: { latencyMs: true, costUsd: true },
      });

      return reply.send({ ip, generations, stats });
    },
  );

  // ─── DELETE /api/admin/generation/:id ───────────────────────
  fastify.delete(
    "/api/admin/generation/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as any;
      await prisma.generation.delete({ where: { id } });
      return reply.send({ deleted: true });
    },
  );

  // ─── GET /api/admin/stats/hourly ───────────────────────────
  // Hourly breakdown for today
  fastify.get(
    "/api/admin/stats/hourly",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const hourly = await prisma.$queryRaw<any[]>`
      SELECT
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as errors,
        COALESCE(SUM("costUsd"), 0) as cost,
        COALESCE(AVG("latencyMs"), 0) as avg_latency
      FROM "Generation"
      WHERE "createdAt" >= ${startOfDay}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour
    `;

      return reply.send(
        hourly.map((h) => ({
          hour: Number(h.hour),
          count: Number(h.count),
          completed: Number(h.completed),
          errors: Number(h.errors),
          cost: Number(h.cost),
          avgLatency: Math.round(Number(h.avg_latency)),
        })),
      );
    },
  );

  // ─── GET /api/admin/stats/daily ────────────────────────────
  // Daily breakdown for last 30 days
  fastify.get(
    "/api/admin/stats/daily",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const daily = await prisma.$queryRaw<any[]>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count,
        COUNT(DISTINCT ip) as unique_ips,
        COALESCE(SUM("costUsd"), 0) as cost,
        COALESCE(AVG("latencyMs"), 0) as avg_latency,
        COALESCE(SUM("totalTokens"), 0) as tokens
      FROM "Generation"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;

      return reply.send(
        daily.map((d) => ({
          date: d.date,
          count: Number(d.count),
          uniqueIps: Number(d.unique_ips),
          cost: Number(d.cost),
          avgLatency: Math.round(Number(d.avg_latency)),
          tokens: Number(d.tokens),
        })),
      );
    },
  );

  // ─── DELETE /api/admin/generations/by-status ──────────────────
  // Bulk delete generations by status (e.g. "pending")
  fastify.delete(
    "/api/admin/generations/by-status",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { status } = request.query as any;
      if (!status)
        return reply.status(400).send({ error: "Missing ?status= param" });

      const result = await prisma.generation.deleteMany({ where: { status } });
      return reply.send({ deleted: result.count, status });
    },
  );

  // ─── DELETE /api/admin/generations/bulk ────────────────────────
  // Bulk delete by array of IDs
  fastify.delete(
    "/api/admin/generations/bulk",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ids } = request.body as any;
      if (!ids || !Array.isArray(ids))
        return reply.status(400).send({ error: "Missing ids array in body" });

      const result = await prisma.generation.deleteMany({
        where: { id: { in: ids } },
      });
      return reply.send({ deleted: result.count });
    },
  );

  // ─── POST /api/admin/user/:ip/bonus ───────────────────────────
  // Set bonus daily generations for IP (+5 = 8 total, -2 = 1 total, 0 = reset to default)
  fastify.post(
    "/api/admin/user/:ip/bonus",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ip } = request.params as any;
      const { bonus, note } = request.body as any;

      if (bonus === undefined || typeof bonus !== "number") {
        return reply
          .status(400)
          .send({ error: "Missing 'bonus' number in body" });
      }

      const override = await prisma.userLimitOverride.upsert({
        where: { ip },
        update: { bonusToday: bonus, note: note || null },
        create: { ip, bonusToday: bonus, note: note || null },
      });

      return reply.send({
        ip,
        bonusToday: override.bonusToday,
        effectiveLimit: 3 + override.bonusToday,
        note: override.note,
      });
    },
  );

  // ─── GET /api/admin/limits ────────────────────────────────────
  // List all user limit overrides
  fastify.get(
    "/api/admin/limits",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const overrides = await prisma.userLimitOverride.findMany({
        orderBy: { updatedAt: "desc" },
      });
      return reply.send(
        overrides.map((o) => ({
          ...o,
          effectiveLimit: 3 + o.bonusToday,
        })),
      );
    },
  );

  // ─── DELETE /api/admin/limit/:ip ──────────────────────────────
  // Remove limit override for IP (resets to default 3)
  fastify.delete(
    "/api/admin/limit/:ip",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { ip } = request.params as any;
      try {
        await prisma.userLimitOverride.delete({ where: { ip } });
        return reply.send({ deleted: true, ip });
      } catch {
        return reply
          .status(404)
          .send({ error: "No override found for this IP" });
      }
    },
  );
}
