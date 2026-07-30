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
      "rating": number
    }
  ]
}

"rating" is the worthiness of visiting, scored out of 100. Use null for values you don't know instead of omitting the key. Return 5 to 15 of the best spots.`;

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
