import { sprintf } from 'sprintf-js';
import DestinationSpot, { IDestinationSpot } from '../DB_Models/DB_DestinationSpot';
import { findCityByName } from './cityLookup';
import deepseek from '../Deepseek/deepseek';
import { DESTINATION_SPOT_QUERY } from './queryScripts';
import { parseSpotsResponse, saveSpots, RawSpot } from '../mappers/spotMapper';
import { isLikelyDuplicate, NamedPoint } from './spotDedup';

// How far past the shortfall to ask the LLM for, since it won't return
// exactly the number requested.
const TOP_UP_PADDING = 10;

function normalizeName(name: string) {
    return (name || '').trim().toLowerCase();
}

// RawSpot (LLM/mapper-facing) and IDestinationSpot (the Mongoose doc) use
// different field casing for the same data (camelCase vs PascalCase, per
// this repo's documented convention — see CLAUDE.md's "Conventions"), so
// they need separate coordinate extractors rather than one shared shape.
function rawSpotPoint(raw: RawSpot): NamedPoint | null {
    return typeof raw.latitude === 'number' && typeof raw.longitude === 'number'
        ? { name: raw.name, lat: raw.latitude, lng: raw.longitude }
        : null;
}

function savedSpotPoint(spot: IDestinationSpot): NamedPoint | null {
    return typeof spot.Latitude === 'number' && typeof spot.Longitude === 'number'
        ? { name: spot.SpotName, lat: spot.Latitude, lng: spot.Longitude }
        : null;
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
        // risks re-creating near-identical spot rows. Two checks, since either
        // alone has a real gap: exact-name match misses reworded duplicates,
        // and proximity alone flags unrelated nearby spots as duplicates too
        // eagerly — see spotDedup.ts's isLikelyDuplicate() for both examples.
        // Checked against `existing` AND against spots already accepted earlier
        // in this same batch, so one LLM response naming the same place twice
        // doesn't save it twice either.
        const existingNames = new Set(existing.map(spot => normalizeName(spot.SpotName)));
        const existingPoints = existing.map(savedSpotPoint).filter((p): p is NamedPoint => p !== null);

        const dedupedRawSpots: RawSpot[] = [];
        const acceptedPoints: NamedPoint[] = [];
        for (const raw of rawSpots) {
            if (existingNames.has(normalizeName(raw.name))) continue;
            const point = rawSpotPoint(raw);
            if (point && existingPoints.concat(acceptedPoints).some(known => isLikelyDuplicate(known, point))) continue;
            dedupedRawSpots.push(raw);
            if (point) acceptedPoints.push(point);
        }

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
