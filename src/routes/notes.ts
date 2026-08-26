import express from "express";
import { NotesController } from "../controllers/NotesController";

const router = express.Router();

router.get("/", NotesController.getAll);
router.post("/", NotesController.create);
router.get("/:id", NotesController.getById);
router.put("/:id", NotesController.update);
router.delete("/:id", NotesController.remove);

export default router;
