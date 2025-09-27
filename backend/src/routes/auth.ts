import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "../db/client";
import { users } from "../db/schema/sqlite";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const refreshTokenSchema = z.object({
    refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
    // Login endpoint
    app.post("/auth/login", async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid login credentials",
                    details: parsed.error.flatten(),
                },
            });
        }

        const { email, password } = parsed.data;

        // Find user by email
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (!user) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                },
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash || "");
        if (!isValidPassword) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "INVALID_CREDENTIALS",
                    message: "Invalid email or password",
                },
            });
        }

        // Generate tokens
        const accessToken = app.jwt.sign(
            { id: user.id, roles: ["user"] },
            { expiresIn: "15m" }
        );

        const refreshToken = app.jwt.sign(
            { id: user.id, roles: ["user"] },
            { expiresIn: "7d" }
        );

        // Store refresh token (in a real app, you'd store this securely)
        // For now, we'll just return it

        return {
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                },
            },
        };
    });

    // Refresh token endpoint
    app.post("/auth/refresh", async (request, reply) => {
        const parsed = refreshTokenSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid refresh token",
                    details: parsed.error.flatten(),
                },
            });
        }

        try {
            // Verify refresh token
            const decoded = app.jwt.verify(parsed.data.refreshToken) as { id: string; roles: string[] };

            // Generate new tokens
            const accessToken = app.jwt.sign(
                { id: decoded.id, roles: decoded.roles },
                { expiresIn: "15m" }
            );

            const refreshToken = app.jwt.sign(
                { id: decoded.id, roles: decoded.roles },
                { expiresIn: "7d" }
            );

            return {
                success: true,
                data: {
                    accessToken,
                    refreshToken,
                },
            };
        } catch (err) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Invalid or expired refresh token",
                },
            });
        }
    });

    // Logout endpoint
    app.post("/auth/logout", async (request, reply) => {
        // In a real app, you'd invalidate the refresh token in storage
        // For now, just return success
        return {
            success: true,
            data: {
                message: "Logged out successfully",
            },
        };
    });

    // Register endpoint (for development/testing)
    app.post("/auth/register", async (request, reply) => {
        const registerSchema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
            displayName: z.string().min(2),
        });

        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid registration data",
                    details: parsed.error.flatten(),
                },
            });
        }

        const { email, password, displayName } = parsed.data;

        // Check if user already exists
        const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

        if (existingUser) {
            return reply.status(409).send({
                success: false,
                error: {
                    code: "USER_EXISTS",
                    message: "User with this email already exists",
                },
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const userId = nanoid();
        await db.insert(users).values({
            id: userId,
            email,
            passwordHash,
            displayName,
            roles: ["user"],
        });

        return reply.status(201).send({
            success: true,
            data: {
                id: userId,
                email,
                displayName,
            },
        });
    });
}