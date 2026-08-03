import { Router, Request, Response } from 'express';
import { sprintf } from 'sprintf-js';
import deepseek from '../Deepseek/deepseek';
import { DESTINATION_ACCOMMODATION_QUERY } from '../Utils/queryScripts';
import { parseAccommodationsResponse, saveAccommodations } from '../Utils/accommodationMapper';
import { sourceSpotsForCity } from '../Utils/spotSourcing';
import { requireAuth } from '../Utils/auth';

const DEFAULT_MIN_SPOT_COUNT = 15;
const MIN_SPOT_COUNT_FLOOR = 1;
const MIN_SPOT_COUNT_CEILING = 40;

function clampMinCount(rawMinCount: unknown): number {
    const parsed = Number(rawMinCount);
    if (!Number.isFinite(parsed)) {
        return DEFAULT_MIN_SPOT_COUNT;
    }
    return Math.min(MIN_SPOT_COUNT_CEILING, Math.max(MIN_SPOT_COUNT_FLOOR, Math.round(parsed)));
}

const router = Router();

router.post("/", requireAuth, (_req: Request, res: Response) => {
    res.send("Welcome to DS-Service data sourcing API");
});

router.post("/sourcespots", requireAuth, async (req: Request, res: Response) => {
    const { ds, city, minCount } = req.body;
    if (!city) {
        res.status(400).send("Missing required field: city");
        return;
    }

    switch (ds) {
        case "deepseek": {
            try {
                const { spots, newlySourced } = await sourceSpotsForCity(city, clampMinCount(minCount));
                res.status(200).json({ count: spots.length, newlySourced, spots });
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
