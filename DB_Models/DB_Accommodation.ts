import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAccommodation extends Document {
    Name: string;
    Address: string;
    City: Types.ObjectId;
    Latitude: number;
    Longitude: number;
    PriceTier: string;
    Currency?: string;
    Rating: number;
}

const AccommodationSchema = new Schema<IAccommodation>({
    Name: {
        type: String,
        required: true
    },
    Address: {
        type: String,
        required: true
    },
    City: {
        type: Schema.Types.ObjectId,
        ref: "Destination City",
        required: true
    },
    Latitude: {
        type: Number,
        required: true
    },
    Longitude: {
        type: Number,
        required: true
    },
    PriceTier: {
        type: String,
        enum: ["budget", "mid-range", "luxury"],
        required: true
    },
    Currency: {
        type: String
    },
    Rating: {
        type: Number,
        required: true
    }
});

export default mongoose.model<IAccommodation>("Destination Accommodation", AccommodationSchema);
