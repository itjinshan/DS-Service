import { Router, Request, Response } from 'express';

const router = Router();

router.get("/", (_req: Request, res: Response) => {
    res.send("Welcome to DS-Service");
});

export default router;
