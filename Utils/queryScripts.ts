import { SPOT_CATEGORIES } from '../DB_Models/DB_DestinationSpot';

const SPOT_CATEGORY_LIST = SPOT_CATEGORIES.map(c => `"${c}"`).join(' or ');

export const DESTINATION_SPOT_QUERY = `List the must-visit spots in %s.
Respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:

{
  "spots": [
    {
      "name": string,
      "streetAddress": string,
      "city": string,
      "stateOrProvince": string,
      "country": string,
      "latitude": number,
      "longitude": number,
      "bestTimeToVisitInDay": { "description": string, "startTime": string or null (24h "HH:mm"), "endTime": string or null },
      "bestTimeToVisitInYear": { "description": string, "months": string[] },
      "averageTimeSpent": { "description": string, "minMinutes": number or null, "maxMinutes": number or null },
      "fees": { "currency": string or null, "adult": number or null, "senior": number or null, "child": number or null, "parking": number or null, "vehicle": number or null, "notes": string or null },
      "rating": number,
      "category": one of ${SPOT_CATEGORY_LIST} — pick whichever single category best describes the spot
    }
  ]
}

"rating" is the worthiness of visiting, scored out of 100. Use null for values you don't know instead of omitting the key. Return at least %d of the best spots (up to %d if there are genuinely that many worth listing).`;

export const DESTINATION_ACCOMMODATION_QUERY = `List lodging options in %s that fit a "%s" budget tier.
Respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:

{
  "accommodations": [
    {
      "name": string,
      "address": string,
      "city": string,
      "country": string,
      "latitude": number,
      "longitude": number,
      "priceTier": "budget" or "mid-range" or "luxury",
      "currency": string or null,
      "rating": number
    }
  ]
}

"priceTier" must match the requested budget tier. "rating" is the worthiness of staying, scored out of 100. Use null for values you don't know instead of omitting the key. Return 5 to 10 of the best matching options.`;

// Field vocabulary for /nlu/extract — a plain function rather than a fixed
// sprintf template, since the set of requested fields is dynamic per call
// (an intentional, minimal deviation from this file's usual convention).
const NLU_FIELD_DEFINITIONS: Record<string, string> = {
    destination: '"destination": string or null   // a proper place name (city, region, or country) the traveler mentioned; null if none is mentioned',
    duration: '"duration": number or null   // trip length in days, as an integer; null if not mentioned',
    numOfTravelers: '"numOfTravelers": number or null   // number of people traveling, as an integer; null if not mentioned',
    budget: '"budget": "budget" or "mid-range" or "luxury" or null   // the traveler\'s budget tier; null if not mentioned',
    pace: '"pace": "relaxed" or "standard" or "packed" or null   // how full the traveler wants each day\'s itinerary to be; null if not mentioned',
    yesno: '"yesno": "yes" or "no" or null   // whether the traveler answered affirmatively or negatively; null if unclear'
};

export function buildNluExtractionQuery(message: string, fields: string[], context?: string): string {
    const fieldLines = fields
        .map(field => NLU_FIELD_DEFINITIONS[field])
        .filter(Boolean)
        .join(',\n  ');
    const contextLine = context ? `\nContext: ${context}` : '';

    return `Extract the following fields from a traveler's chat message. Respond with ONLY a single JSON object (no markdown fences, no commentary) matching exactly this shape:

{
  ${fieldLines}
}

Message: "${message}"${contextLine}

Use null for any field that genuinely isn't present or determinable from the message — do not guess.`;
}
