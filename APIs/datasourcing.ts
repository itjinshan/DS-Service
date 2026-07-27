import { Router, Request, Response } from 'express';
import { sprintf } from 'sprintf-js';
import deepseek from '../Deepseek/deepseek';
import { DESTINATION_SPOT_QUERY } from '../Utils/queryScripts';
import { parseSpotsResponse, saveSpots } from '../Utils/spotMapper';
import { requireAuth } from '../Utils/auth';

const router = Router();

router.post("/", requireAuth, (_req: Request, res: Response) => {
    res.send("Welcome to DS-Service data sourcing API");
});

router.post("/sourcespots", requireAuth, async (req: Request, res: Response) => {
    const { ds, city } = req.body;
    if (!city) {
        res.status(400).send("Missing required field: city");
        return;
    }

    switch (ds) {
        case "deepseek": {
            try {
                const spotsFetchingQuery = sprintf(DESTINATION_SPOT_QUERY, city);
                const llmResponse = await deepseek(spotsFetchingQuery, { jsonMode: true });
                const rawSpots = parseSpotsResponse(llmResponse.content ?? "");
                const savedSpots = await saveSpots(rawSpots);
                res.status(200).json({ count: savedSpots.length, spots: savedSpots });
            } catch (err) {
                console.error("Error sourcing spots from deepseek:", err);
                res.status(502).send("Failed to source spot data");
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
