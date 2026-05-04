import { Router } from "express";
import { db, entriesTable, hustlesTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { CreateEntryBody, DeleteEntryParams, ListEntriesQueryParams, UpdateEntryBody } from "@workspace/api-zod";

const router = Router();

router.get("/entries", async (req, res) => {
  try {
    const parsed = ListEntriesQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const { hustleId, limit } = parsed.data;

    const query = db
      .select({
        id: entriesTable.id,
        hustleId: entriesTable.hustleId,
        hustleName: hustlesTable.name,
        amount: sql<number>`${entriesTable.amount}`.mapWith(Number),
        date: entriesTable.date,
        note: entriesTable.note,
        createdAt: entriesTable.createdAt,
      })
      .from(entriesTable)
      .innerJoin(hustlesTable, eq(entriesTable.hustleId, hustlesTable.id))
      .orderBy(desc(entriesTable.date), desc(entriesTable.createdAt))
      .$dynamic();

    let entries = await query;

    if (hustleId !== undefined) {
      entries = entries.filter((e) => e.hustleId === hustleId);
    }
    if (limit !== undefined) {
      entries = entries.slice(0, limit);
    }

    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "Failed to list entries");
    res.status(500).json({ error: "Failed to list entries" });
  }
});

router.post("/entries", async (req, res) => {
  try {
    const parsed = CreateEntryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const { hustleId, amount, date, note } = parsed.data;

    const hustle = await db
      .select()
      .from(hustlesTable)
      .where(eq(hustlesTable.id, hustleId))
      .limit(1);

    if (hustle.length === 0) {
      res.status(404).json({ error: "Hustle not found" });
      return;
    }

    const [entry] = await db
      .insert(entriesTable)
      .values({
        hustleId,
        amount: String(amount),
        date,
        note: note ?? null,
      })
      .returning();

    res.status(201).json({
      ...entry,
      amount: Number(entry.amount),
      hustleName: hustle[0].name,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create entry");
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.patch("/entries/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id ?? "", 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const bodyParsed = UpdateEntryBody.safeParse(req.body);
    if (!bodyParsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { hustleId, amount, date, note } = bodyParsed.data;

    const updates: Record<string, unknown> = {};
    if (hustleId !== undefined) updates.hustleId = hustleId;
    if (amount !== undefined) updates.amount = String(amount);
    if (date !== undefined) updates.date = date;
    if (note !== undefined) updates.note = note;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const existing = await db
      .select({ hustleId: entriesTable.hustleId })
      .from(entriesTable)
      .where(eq(entriesTable.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    const [updated] = await db
      .update(entriesTable)
      .set(updates)
      .where(eq(entriesTable.id, id))
      .returning();

    const finalHustleId = (updates.hustleId as number) ?? existing[0].hustleId;
    const hustle = await db
      .select({ name: hustlesTable.name })
      .from(hustlesTable)
      .where(eq(hustlesTable.id, finalHustleId))
      .limit(1);

    res.json({
      ...updated,
      amount: Number(updated.amount),
      hustleName: hustle[0]?.name ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update entry");
    res.status(500).json({ error: "Failed to update entry" });
  }
});

router.delete("/entries/:id", async (req, res) => {
  try {
    const parsed = DeleteEntryParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    await db.delete(entriesTable).where(eq(entriesTable.id, parsed.data.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete entry");
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
