import Accommodation, { IAccommodation } from '../DB_Models/DB_Accommodation';
import { findOrCreateCity } from './cityLookup';

export interface RawAccommodation {
    name: string;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    priceTier: string;
    currency?: string | null;
    rating: number;
}

export function parseAccommodationsResponse(content: string): RawAccommodation[] {
    let payload: any;
    try {
        payload = JSON.parse(content);
    } catch (err) {
        throw new Error("LLM response was not valid JSON");
    }

    const accommodations = Array.isArray(payload) ? payload : payload?.accommodations;
    if (!Array.isArray(accommodations)) {
        throw new Error("LLM response did not contain an 'accommodations' array");
    }

    return accommodations;
}

export async function saveAccommodations(rawAccommodations: RawAccommodation[]): Promise<IAccommodation[]> {
    const saved: IAccommodation[] = [];

    for (const raw of rawAccommodations) {
        const city = await findOrCreateCity(raw.city, raw.country);
        const accommodation = await Accommodation.create({
            Name: raw.name,
            Address: raw.address,
            City: city._id,
            Latitude: raw.latitude,
            Longitude: raw.longitude,
            PriceTier: raw.priceTier,
            Currency: raw.currency ?? undefined,
            Rating: raw.rating
        });
        saved.push(accommodation);
    }

    return saved;
}
