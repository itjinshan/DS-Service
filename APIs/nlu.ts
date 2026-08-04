import { Router, Request, Response } from 'express';
import deepseek from '../Deepseek/deepseek';
import { buildNluExtractionQuery } from '../Utils/queryScripts';
import { parseExtractionResponse } from '../Utils/nluMapper';
import { requireAuth } from '../Utils/auth';

const VALID_FIELDS = ['destination', 'duration', 'numOfTravelers', 'budget', 'pace', 'yesno'];

const router = Router();

router.post("/", requireAuth, (_req: Request, res: Response) => {
    res.send("Welcome to DS-Service NLU API");
});

router.post("/extract", requireAuth, async (req: Request, res: Response) => {
    const { ds, message, fields, context } = req.body;

    if (!message) {
        res.status(400).send("Missing required field: message");
        return;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
        res.status(400).send("Missing required field: fields");
        return;
    }
    const invalidField = fields.find((field: string) => !VALID_FIELDS.includes(field));
    if (invalidField) {
        res.status(400).send(`Invalid field: ${invalidField}`);
        return;
    }

    switch (ds) {
        case "deepseek": {
            try {
                const query = buildNluExtractionQuery(message, fields, context);
                const llmResponse = await deepseek(query, { jsonMode: true });
                const extracted = parseExtractionResponse(llmResponse.content ?? "", fields);
                res.status(200).json({ extracted });
            } catch (err) {
                console.error("Error extracting fields from deepseek:", err);
                res.status(502).send("Failed to extract fields");
            }
            break;
        }
        case "chatgpt":
            res.status(501).send("chatgpt data source is not implemented yet");
            break;
        default:
            res.status(400).send("Invalid data source");
    }
});

export default router;
