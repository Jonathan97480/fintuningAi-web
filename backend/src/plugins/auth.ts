import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../config/env";

declare module "fastify" {
  interface FastifyRequest {
    user: { id: string; roles: string[] };
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; roles: string[] };
    user: { id: string; roles: string[] };
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.addHook("preHandler", async (request, reply) => {
    if (request.url?.startsWith("/health") || request.url?.startsWith("/auth")) {
      return;
    }

    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Unauthorized" });
    }
  });
});
