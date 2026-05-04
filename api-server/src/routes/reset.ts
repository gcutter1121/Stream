import { Router } from "express";
import { db, entriesTable, goalsTable } from "@workspace/db";

const router = Router();

router.post("/reset", async (req, res) => {
  try {
    const resetGoals = req.body?.resetGoals === true;

    await db.delete(entriesTable);

    if (resetGoals) {
      await db.delete(goalsTable);
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to reset data");
    res.status(500).json({ error: "Failed to reset data" });
  }
});

export default router;
