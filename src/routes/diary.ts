import express from "express";
import { DiaryController } from "../controllers/DiaryController";

const router = express.Router();

router.get("/", DiaryController.getAll);
router.post("/", DiaryController.create);
router.post("/settle-multiple", DiaryController.settleMultiple);
router.post("/migrate-to-ledger", DiaryController.migrateToLedger);
router.post("/pay-partial", DiaryController.payPartial);

router.get("/:id", DiaryController.getById);
router.put("/:id", DiaryController.update);
router.delete("/:id", DiaryController.remove);
router.put("/:id/settle", DiaryController.settleSingle);

// The frontend has a /:id/ledger route for migrating a single one, let's map it:
router.put("/:id/ledger", async (req, res) => {
  // Map it to migrateToLedger logic
  try {
     const { cid, name, phone } = req.body;
     await DiaryController.migrateToLedger({
         body: { cid, name, phone, entryIds: [req.params.id] }
     } as any, res as any);
  } catch(e) {
     res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
