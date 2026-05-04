import { Router } from "express";
import { db, hustlesTable, entriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { CreateHustleBody, DeleteHustleParams } from "@workspace/api-zod";

const router = Router();

router.get("/hustles", async (req, res) => {
  try {
    const hustles = await db
      .select({
        id: hustlesTable.id,
        name: hustlesTable.name,
        recurring: hustlesTable.recurring,
        createdAt: hustlesTable.createdAt,
        totalEarned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number),
        entryCount: sql<number>`count(${entriesTable.id})`.mapWith(Number),
      })
      .from(hustlesTable)
      .leftJoin(entriesTable, eq(hustlesTable.id, entriesTable.hustleId))
      .groupBy(hustlesTable.id, hustlesTable.name, hustlesTable.recurring, hustlesTable.createdAt)
      .orderBy(hustlesTable.createdAt);

    res.json(hustles);
  } catch (err) {
    req.log.error({ err }, "Failed to list hustles");
    res.status(500).json({ error: "Failed to list hustles" });
  }
});

router.post("/hustles", async (req, res) => {
  try {
    const parsed = CreateHustleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [hustle] = await db
      .insert(hustlesTable)
      .values({ name: parsed.data.name })
      .returning();

    res.status(201).json({
      ...hustle,
      totalEarned: 0,
      entryCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create hustle");
    res.status(500).json({ error: "Failed to create hustle" });
  }
});

router.patch("/hustles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id ?? "", 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const recurring = req.body?.recurring ?? null;
    const validRecurring = ["weekly", "biweekly", "monthly", null];
    if (!validRecurring.includes(recurring)) {
      res.status(400).json({ error: "Invalid recurring value" });
      return;
    }

    await db.update(hustlesTable).set({ recurring }).where(eq(hustlesTable.id, id));

    const [updated] = await db
      .select({
        id: hustlesTable.id,
        name: hustlesTable.name,
        recurring: hustlesTable.recurring,
        createdAt: hustlesTable.createdAt,
        totalEarned: sql<number>`coalesce(sum(${entriesTable.amount}), 0)`.mapWith(Number),
        entryCount: sql<number>`count(${entriesTable.id})`.mapWith(Number),
      })
      .from(hustlesTable)
      .leftJoin(entriesTable, eq(hustlesTable.id, entriesTable.hustleId))
      .groupBy(hustlesTable.id, hustlesTable.name, hustlesTable.recurring, hustlesTable.createdAt)
      .where(eq(hustlesTable.id, id));

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update hustle");
    res.status(500).json({ error: "Failed to update hustle" });
  }
});

router.delete("/hustles/:id", async (req, res) => {
  try {
    const parsed = DeleteHustleParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    await db.delete(hustlesTable).where(eq(hustlesTable.id, parsed.data.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete hustle");
    res.status(500).json({ error: "Failed to delete hustle" });
  }
});

export default router;
