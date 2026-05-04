import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hustlesRouter from "./hustles";
import entriesRouter from "./entries";
import summaryRouter from "./summary";
import goalsRouter from "./goals";
import statsRouter from "./stats";
import resetRouter from "./reset";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hustlesRouter);
router.use(entriesRouter);
router.use(summaryRouter);
router.use(goalsRouter);
router.use(statsRouter);
router.use(resetRouter);

export default router;
