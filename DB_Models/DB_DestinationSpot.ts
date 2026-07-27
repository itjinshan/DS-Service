import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFees {
    Currency?: string;
    Adult?: number;
    Senior?: number;
    Child?: number;
    Parking?: number;
    Vehicle?: number;
    Notes?: string;
}

export interface ITimeOfDayWindow {
    Description: string;
    StartTime?: string;
    EndTime?: string;
}

export interface ISeasonWindow {
    Description: string;
    Months?: string[];
}

export interface IVisitDuration {
    Description: string;
    MinMinutes?: number;
    MaxMinutes?: number;
}

export interface IDestinationSpot extends Document {
    SpotName: string;
    StreetAddress: string;
    City: Types.ObjectId;
    StateOrProvince: string;
    Country: string;
    Latitude: number;
    Longitude: number;
    BestTimeToVisitInDay: ITimeOfDayWindow;
    BestTimeToVisitInYear: ISeasonWindow;
    AverageTimeSpent: IVisitDuration;
    Fees: IFees;
    Rating: number;
}

const FeesSchema = new Schema<IFees>({
    Currency: { type: String },
    Adult: { type: Number },
    Senior: { type: Number },
    Child: { type: Number },
    Parking: { type: Number },
    Vehicle: { type: Number },
    Notes: { type: String }
}, { _id: false });

const TimeOfDayWindowSchema = new Schema<ITimeOfDayWindow>({
    Description: { type: String, required: true },
    StartTime: { type: String },
    EndTime: { type: String }
}, { _id: false });

const SeasonWindowSchema = new Schema<ISeasonWindow>({
    Description: { type: String, required: true },
    Months: [{ type: String }]
}, { _id: false });

const VisitDurationSchema = new Schema<IVisitDuration>({
    Description: { type: String, required: true },
    MinMinutes: { type: Number },
    MaxMinutes: { type: Number }
}, { _id: false });

const DestinationSpotSchema = new Schema<IDestinationSpot>({
    SpotName: {
        type: String,
        required: true
    },
    StreetAddress: {
        type: String,
        required: true
    },
    City: {
        type: Schema.Types.ObjectId,
        ref: "Destination City",
        required: true
    },
    StateOrProvince: {
        type: String,
        required: true
    },
    Country: {
        type: String,
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
    BestTimeToVisitInDay: {
        type: TimeOfDayWindowSchema,
        required: true
    },
    BestTimeToVisitInYear: {
        type: SeasonWindowSchema,
        required: true
    },
    AverageTimeSpent: {
        type: VisitDurationSchema,
        required: true
    },
    Fees: {
        type: FeesSchema,
        default: () => ({})
    },
    Rating: {
        type: Number,
        required: true
    }
});

export default mongoose.model<IDestinationSpot>("Destination Spot", DestinationSpotSchema);
