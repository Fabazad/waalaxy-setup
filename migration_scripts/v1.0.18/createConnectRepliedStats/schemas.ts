import { Connection, Document, Model, Schema } from 'mongoose';
import { Traveler } from '../denormalizeWorldsAndOrigins/persistance/interfaces';
import { TRAVELER_STATUSES } from './constants';
import { IConnectStat, IEmailStat, IFollowStat, IMessageRequestStat, IMessageStat, IUserKpi, IVisitStat } from './interfaces';

// Traveler

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
            validationDate: { type: String },
        },
    },
    { _id: false },
);

const status = {
    value: { type: String, enum: TRAVELER_STATUSES, required: true },
    reason: { type: String, default: undefined },
};

export const TravelerSchema = new Schema(
    {
        campaign: {
            type: Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true,
        },
        world: {},
        origin: {},
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
                    world: {},
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

export const TravelerModel = (c: Connection) => c.model<Traveler & Document>('Traveler', TravelerSchema);

const ConnectStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['sent', 'accepted', 'replied'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const ConnectStatModel = (c: Connection) => c.model<IConnectStat & Document>('ConnectStat', ConnectStatSchema);

const EmailStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['sent'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const EmailStatModel = (c: Connection) => c.model<IEmailStat & Document>('EmailStat', EmailStatSchema);

const FollowStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['followed'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const FollowStatModel = (c: Connection) => c.model<IFollowStat & Document>('FollowStat', FollowStatSchema);

const MessageRequestStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['sent', 'replied'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const MessageRequestStatModel = (c: Connection) => c.model<IMessageRequestStat & Document>('MessageRequestStat', MessageRequestStatSchema);

const MessageStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['sent', 'replied'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const MessageStatModel = (c: Connection) => c.model<IMessageStat & Document>('MessageStat', MessageStatSchema);

const VisitStatSchema = new Schema(
    {
        user: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: Date, required: true },
        campaign: { type: String, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['visited'], required: true },
    },
    { timestamps: true },
).index(
    {
        user: 1,
        action: 1,
        status: 1,
    },
    {
        unique: true,
    },
);

export const VisitStatModel = (c: Connection) => c.model<IVisitStat & Document>('VisitStat', VisitStatSchema);
