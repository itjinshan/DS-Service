import DestinationSpot, { IDestinationSpot } from '../DB_Models/DB_DestinationSpot';
import { findOrCreateCity } from './cityLookup';

interface RawFees {
    currency?: string | null;
    adult?: number | null;
    senior?: number | null;
    child?: number | null;
    parking?: number | null;
    vehicle?: number | null;
    notes?: string | null;
}

interface RawTimeOfDayWindow {
    description: string;
    startTime?: string | null;
    endTime?: string | null;
}

interface RawSeasonWindow {
    description: string;
    months?: string[];
}

interface RawVisitDuration {
    description: string;
    minMinutes?: number | null;
    maxMinutes?: number | null;
}

export interface RawSpot {
    name: string;
    streetAddress: string;
    city: string;
    stateOrProvince: string;
    country: string;
    latitude: number;
    longitude: number;
    bestTimeToVisitInDay: RawTimeOfDayWindow;
    bestTimeToVisitInYear: RawSeasonWindow;
    averageTimeSpent: RawVisitDuration;
    fees?: RawFees;
    rating: number;
}

export function parseSpotsResponse(content: string): RawSpot[] {
    let payload: any;
    try {
        payload = JSON.parse(content);
    } catch (err) {
        throw new Error("LLM response was not valid JSON");
    }

    const spots = Array.isArray(payload) ? payload : payload?.spots;
    if (!Array.isArray(spots)) {
        throw new Error("LLM response did not contain a 'spots' array");
    }

    return spots;
}

export async function saveSpots(rawSpots: RawSpot[]): Promise<IDestinationSpot[]> {
    const saved: IDestinationSpot[] = [];

    for (const raw of rawSpots) {
        const city = await findOrCreateCity(raw.city, raw.country);
        const spot = await DestinationSpot.create({
            SpotName: raw.name,
            StreetAddress: raw.streetAddress,
            City: city._id,
            StateOrProvince: raw.stateOrProvince,
            Country: raw.country,
            Latitude: raw.latitude,
            Longitude: raw.longitude,
            BestTimeToVisitInDay: {
                Description: raw.bestTimeToVisitInDay?.description,
                StartTime: raw.bestTimeToVisitInDay?.startTime ?? undefined,
                EndTime: raw.bestTimeToVisitInDay?.endTime ?? undefined
            },
            BestTimeToVisitInYear: {
                Description: raw.bestTimeToVisitInYear?.description,
                Months: raw.bestTimeToVisitInYear?.months ?? []
            },
            AverageTimeSpent: {
                Description: raw.averageTimeSpent?.description,
                MinMinutes: raw.averageTimeSpent?.minMinutes ?? undefined,
                MaxMinutes: raw.averageTimeSpent?.maxMinutes ?? undefined
            },
            Fees: {
                Currency: raw.fees?.currency ?? undefined,
                Adult: raw.fees?.adult ?? undefined,
                Senior: raw.fees?.senior ?? undefined,
                Child: raw.fees?.child ?? undefined,
                Parking: raw.fees?.parking ?? undefined,
                Vehicle: raw.fees?.vehicle ?? undefined,
                Notes: raw.fees?.notes ?? undefined
            },
            Rating: raw.rating
        });
        saved.push(spot);
    }

    return saved;
}
