import mongoose, { Document, Schema } from 'mongoose';

export interface IDestinationCountry extends Document {
    CountryName: string;
    CountryCode?: string;
    Continent?: string;
    Currency?: string;
    CurrencyCode?: string;
    CurrencySymbol?: string;
}

const DestinationCountrySchema = new Schema<IDestinationCountry>({
    CountryName: {
        type: String,
        required: true
    },
    // The remaining fields are only known when a country is curated by hand;
    // records auto-created from spot sourcing only have a name and get
    // enriched later, so these stay optional.
    CountryCode: {
        type: String
    },
    Continent: {
        type: String
    },
    Currency: {
        type: String
    },
    CurrencyCode: {
        type: String
    },
    CurrencySymbol: {
        type: String
    }
});

export default mongoose.model<IDestinationCountry>("Destination Country", DestinationCountrySchema);
