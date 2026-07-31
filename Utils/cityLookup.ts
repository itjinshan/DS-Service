import DestinationCity from '../DB_Models/DB_DestinationCity';
import DestinationCountry from '../DB_Models/DB_DestinationCountry';

async function findOrCreateCountry(countryName: string) {
    const existing = await DestinationCountry.findOne({ CountryName: countryName });
    if (existing) {
        return existing;
    }
    // Spot/accommodation sourcing only yields a country name; the rest of the
    // country record is left blank here and can be enriched by a separate process.
    return DestinationCountry.create({ CountryName: countryName });
}

export async function findOrCreateCity(cityName: string, countryName: string) {
    const existing = await DestinationCity.findOne({ CityName: cityName });
    if (existing) {
        return existing;
    }
    const country = await findOrCreateCountry(countryName);
    return DestinationCity.create({ CityName: cityName, CountryIn: country._id });
}
