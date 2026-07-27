import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDestinationCity extends Document {
    CityName: string;
    AirportCodes: { AirportCode?: string }[];
    CountryIn: Types.ObjectId;
}

const DestinationCitySchema = new Schema<IDestinationCity>({
    CityName: {
        type: String,
        required: true
    },
    AirportCodes: [{
        AirportCode: {
            type: String
        }
    }],
    CountryIn: {
        type: Schema.Types.ObjectId,
        ref: "Destination Country",
        required: true
    }
});

export default mongoose.model<IDestinationCity>("Destination City", DestinationCitySchema);
