import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hustlesTable = pgTable("hustles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  recurring: text("recurring"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHustleSchema = createInsertSchema(hustlesTable).omit({ id: true, createdAt: true });
export type InsertHustle = z.infer<typeof insertHustleSchema>;
export type Hustle = typeof hustlesTable.$inferSelect;
