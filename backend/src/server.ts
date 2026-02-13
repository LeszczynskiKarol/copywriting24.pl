import Fastify from "fastify";
import cors from "@fastify/cors";
import generateRoutes from "./routes/generate.js";
import adminRoutes from "./routes/admin.js";

const fastify = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
    },
  },
  trustProxy: true,
});

async function start() {
  await fastify.register(cors, {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "https://copywriting24.pl",
      "https://www.copywriting24.pl",
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "x-admin-token"],
  });

  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string", bodyLimit: 1048576 },
    (req, body, done) => {
      try {
        done(null, (body as string) ? JSON.parse(body as string) : {});
      } catch (err: any) {
        done(err);
      }
    },
  );

  await fastify.register(generateRoutes);
  await fastify.register(adminRoutes);

  const port = parseInt(process.env.PORT || "3001");
  const host = process.env.HOST || "0.0.0.0";

  try {
    await fastify.listen({ port, host });
    console.log(`\n🚀 Copywriting24 API at http://${host}:${port}`);
    console.log(
      `   📋 Public:  POST /api/generate | /api/generate/stream | GET /api/limit-status`,
    );
    console.log(
      `   🔒 Admin:   GET /api/admin/dashboard | /generations | /users | /stats/*`,
    );
    console.log(
      `   🔑 Token:   ${process.env.ADMIN_TOKEN ? "CONFIGURED ✅" : "⚠️  Set ADMIN_TOKEN in .env!"}\n`,
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
