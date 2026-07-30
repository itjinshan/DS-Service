import { Router, Request, Response } from 'express';
import { sprintf } from 'sprintf-js';
import deepseek from '../Deepseek/deepseek';
import { DESTINATION_SPOT_QUERY, DESTINATION_ACCOMMODATION_QUERY } from '../Utils/queryScripts';
import { parseSpotsResponse, saveSpots } from '../Utils/spotMapper';
import { parseAccommodationsResponse, saveAccommodations } from '../Utils/accommodationMapper';
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

// Note: doesn't yet bias toward central/convenient locations using the
// trip's already-sourced spot coordinates — that's a documented "ideally"
// in CLAUDE.md's lodging-flow plan, not implemented in this first pass.
router.post("/sourceaccommodations", requireAuth, async (req: Request, res: Response) => {
    const { ds, city, budget } = req.body;
    if (!city) {
        res.status(400).send("Missing required field: city");
        return;
    }
    if (!budget) {
        res.status(400).send("Missing required field: budget");
        return;
    }

    switch (ds) {
        case "deepseek": {
            try {
                const accommodationsFetchingQuery = sprintf(DESTINATION_ACCOMMODATION_QUERY, city, budget);
                const llmResponse = await deepseek(accommodationsFetchingQuery, { jsonMode: true });
                const rawAccommodations = parseAccommodationsResponse(llmResponse.content ?? "");
                const savedAccommodations = await saveAccommodations(rawAccommodations);
                res.status(200).json({ count: savedAccommodations.length, accommodations: savedAccommodations });
            } catch (err) {
                console.error("Error sourcing accommodations from deepseek:", err);
                res.status(502).send("Failed to source accommodation data");
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
