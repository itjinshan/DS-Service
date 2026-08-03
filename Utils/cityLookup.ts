import DestinationCity from '../DB_Models/DB_DestinationCity';
import DestinationCountry from '../DB_Models/DB_DestinationCountry';

function exactCaseInsensitive(value: string) {
    const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`^${escaped}$`, 'i');
}

async function findOrCreateCountry(countryName: string) {
    const existing = await DestinationCountry.findOne({ CountryName: exactCaseInsensitive(countryName) });
    if (existing) {
        return existing;
    }
    // Spot/accommodation sourcing only yields a country name; the rest of the
    // country record is left blank here and can be enriched by a separate process.
    return DestinationCountry.create({ CountryName: countryName });
}

// Read-only lookup, no country name required — used by spotSourcing.ts's
// DB-first check, which only knows a city name (not its country) until an
// LLM response comes back. A miss here means zero existing spots by
// definition (every saved spot's City ref is created via findOrCreateCity),
// so there's nothing to gain by creating the city record this early.
export async function findCityByName(cityName: string) {
    return DestinationCity.findOne({ CityName: exactCaseInsensitive(cityName) });
}

// Case-insensitive so repeat lookups for the same city ("Paris" vs "paris")
// reliably hit the existing record — load-bearing for spotSourcing.ts's
// DB-first check, not just cosmetic.
export async function findOrCreateCity(cityName: string, countryName: string) {
    const existing = await DestinationCity.findOne({ CityName: exactCaseInsensitive(cityName) });
    if (existing) {
        return existing;
    }
    const country = await findOrCreateCountry(countryName);
    return DestinationCity.create({ CityName: cityName, CountryIn: country._id });
}
