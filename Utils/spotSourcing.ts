import { sprintf } from 'sprintf-js';
import DestinationSpot, { IDestinationSpot } from '../DB_Models/DB_DestinationSpot';
import { findCityByName } from './cityLookup';
import deepseek from '../Deepseek/deepseek';
import { DESTINATION_SPOT_QUERY } from './queryScripts';
import { parseSpotsResponse, saveSpots } from '../mappers/spotMapper';

// How far past the shortfall to ask the LLM for, since it won't return
// exactly the number requested.
const TOP_UP_PADDING = 10;

function normalizeName(name: string) {
    return (name || '').trim().toLowerCase();
}

// DB-first, LLM-top-up: check Mongo for spots already sourced for this city
// before ever calling the LLM, and only ask for the shortfall. This is the
// seam a future cache-layer check (see CLAUDE.md's "Caching layer" pending
// task) will wrap in front of, without needing a redesign.
export async function sourceSpotsForCity(city: string, minCount: number): Promise<{ spots: IDestinationSpot[]; newlySourced: number }> {
    const cityDoc = await findCityByName(city);
    const existing: IDestinationSpot[] = cityDoc ? await DestinationSpot.find({ City: cityDoc._id }) : [];

    const shortfall = minCount - existing.length;
    let newlySaved: IDestinationSpot[] = [];

    if (shortfall > 0) {
        const query = sprintf(DESTINATION_SPOT_QUERY, city, shortfall, shortfall + TOP_UP_PADDING);
        const llmResponse = await deepseek(query, { jsonMode: true });
        const rawSpots = parseSpotsResponse(llmResponse.content ?? "");

        // Dedupe against what's already in Mongo before saving — the LLM has no
        // memory of prior calls for this city, so without this every top-up call
        // risks re-creating near-identical spot rows.
        const existingNames = new Set(existing.map(spot => normalizeName(spot.SpotName)));
        const dedupedRawSpots = rawSpots.filter(raw => !existingNames.has(normalizeName(raw.name)));

        newlySaved = await saveSpots(dedupedRawSpots);
    }

    // Cap the returned list to `minCount`, preferring the highest-rated spots.
    // Without this, a popular city's ever-growing sourced pool would
    // eventually return everything ever collected for it — ballooning
    // response size and, for short trips, cramming every known spot into a
    // single day instead of a curated subset. `newlySourced` still reports
    // how many were genuinely created this call, independent of the cap.
    const combined = existing.concat(newlySaved).sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
    const spots = combined.slice(0, minCount);

    return { spots, newlySourced: newlySaved.length };
}
