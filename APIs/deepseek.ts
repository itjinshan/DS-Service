import { Router, Request, Response } from 'express';
import deepseek from '../Deepseek/deepseek';
import { requireAuth } from '../Utils/auth';

const router = Router();

router.post("/", requireAuth, (_req: Request, res: Response) => {
    res.send("Welcome to DS-Service deepseek API");
});

router.post("/plantrip", requireAuth, async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) {
        res.status(400).send("Missing required field: query");
        return;
    }

    try {
        const response = await deepseek(query);
        res.status(200).send(response);
    } catch (err) {
        console.error("Error calling deepseek:", err);
        res.status(502).send("Failed to generate response from deepseek");
    }
});

export default router;
