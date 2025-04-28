import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Mountebank stubs schema
export const stubs = pgTable("stubs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStubSchema = createInsertSchema(stubs).pick({
  filename: true,
  content: true,
});

export type InsertStub = z.infer<typeof insertStubSchema>;
export type Stub = typeof stubs.$inferSelect;

// Zod schema for validating stub form data
export const stubFormDataSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]).default("PUT"),
  path: z.string().min(1, "Path is required"),
  statusCode: z.number().int().min(100).max(599),
  queryParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
  headers: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    })
  ),
  responseBody: z.string(),
});

export type StubFormData = z.infer<typeof stubFormDataSchema>;
