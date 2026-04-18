import { Router, type IRouter } from "express";
import healthRouter from "./health";
import policiesRouter from "./policies";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(policiesRouter);
router.use(dashboardRouter);
router.use(chatRouter);

export default router;
