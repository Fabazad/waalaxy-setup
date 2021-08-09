import { Connection, Document, Schema } from 'mongoose';
import { INewTraveler, IOldTraveler, TRAVELER_STATUSES } from './interfaces';

const stop = new Schema(
    {
        id: { type: String, required: true },
        waypoint: { type: String, required: true },
        type: { type: String, required: true },
        params: {},
        arrivalDate: { type: Date, required: true },
        status: {
            value: {
                type: String,
                enum: ['failed', 'waiting_for_validation', 'validated'],
                required: true,
            },
            reason: { type: String },
        },
    },
    { _id: false },
);

const status = {
    value: { type: String, enum: TRAVELER_STATUSES, required: true },
    reason: { type: String },
};

const OldTravelerSchema = new Schema(
    {
        campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: Schema.Types.Mixed, required: true },
        status,
        history: { type: [{}], required: true },
        currentStop: stop,
        travelStates: {
            type: [
                {
                    stops: {
                        type: [stop],
                        required: true,
                    },
                    paths: { type: [{ type: String, required: true }], required: true },
                    world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
                    arrivalDate: { type: Date, required: true },
                    leaveDate: { type: Date },
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

const TravelerSchema = new Schema(
    {
        campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: Schema.Types.Mixed, required: true },
        status,
        history: { type: [{}], required: true },
        currentStop: stop,
        travelStates: {
            type: [
                {
                    stops: {
                        type: [stop],
                        required: true,
                    },
                    paths: { type: [{ type: String, required: true }], required: true },
                    world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
                    arrivalDate: { type: Date, required: true },
                    leaveDate: { type: Date },
                    currentStop: stop,
                    status,
                    previousTravelState: { type: Number, default: null },
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

export const OldTravelerModel = (c: Connection) => c.model<IOldTraveler & Document>('OldTraveler', OldTravelerSchema, 'travelers');

export const NewTravelerModel = (c: Connection) => c.model<INewTraveler & Document>('NewTraveler', TravelerSchema, 'Travelers');
