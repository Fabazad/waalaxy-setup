import mongoose, { Connection, Document, Schema } from 'mongoose';
import { BASE_CAMPAIGN_PRIORITY, CAMPAIGN_STATES, TRAVELER_STATUSES } from './constants';
import { Campaign, OldCampaign, OldTraveler, Origin, Traveler, World } from './interfaces';

// World

const waypoint = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        params: {},
    },
    { _id: false },
);

const path = new mongoose.Schema(
    {
        id: { type: String, required: true },
        to: { type: String, required: true },
        from: { type: String, required: true },
        condition: {},
    },
    { _id: false },
);

export const WorldSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        userId: { type: String, required: true },
        startingPoint: waypoint,
        waypoints: {
            type: [waypoint],
            required: true,
        },
        paths: {
            type: [path],
            required: true,
        },
        complexity: { type: Number, required: true },
        tags: { type: [String], required: true },
        worldTemplate: {
            type: {
                _id: {
                    type: Schema.Types.ObjectId,
                    ref: 'WorldTemplate',
                    required: true,
                },
                name: { type: String, required: true },
            },
            required: false,
        },
    },
    { timestamps: true },
);

export const WorldModel = (c: Connection) => c.model<World & Document>('World', WorldSchema);

// Origin

export const possibleOrigins = {
    trigger: 'trigger' as const,
    prospect_batch: 'prospect_batch' as const,
};

const OriginSchema = new mongoose.Schema(
    {
        origin: { type: String, required: true, enum: Object.values(possibleOrigins) },
        travelerCount: { type: Number, required: true },
        trigger: { type: String },
        prospectList: {},
    },
    { timestamps: true },
);

export const OriginModel = (c: Connection) => c.model<Origin & Document>('Origin', OriginSchema);

// Campaign

export const CampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: String, required: true },
        world: {},
        priority: { type: Number, required: true, default: BASE_CAMPAIGN_PRIORITY },
        triggers: {
            type: [{ type: String, required: true }],
            required: true,
        },
        state: { type: String, enum: CAMPAIGN_STATES, required: true },
        origins: [{}],
        iconColor: { type: String, required: false },
        subWorlds: {
            onReply: {
                world: {},
            },
        },
        worldTags: {
            type: [String],
            required: true,
        },
        worldComplexity: {
            type: Number,
            required: true,
        },
        frozen: {
            reason: String,
        },
    },
    { timestamps: true },
);

export const CampaignModel = (c: Connection) => c.model<Campaign & Document>('Campaign', CampaignSchema);

export const OldCampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: String, required: true },
        world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
        priority: { type: Number, required: true, default: BASE_CAMPAIGN_PRIORITY },
        triggers: {
            type: [{ type: String, required: true }],
            required: true,
        },
        state: { type: String, enum: CAMPAIGN_STATES, required: true },
        origins: [{ type: Schema.Types.ObjectId, ref: 'Origin', required: true }],
        iconColor: { type: String, required: false },
        subWorlds: {
            onReply: {
                world: {
                    type: WorldSchema,
                    required: false,
                },
            },
        },
        worldTags: {
            type: [String],
            required: true,
        },
        worldComplexity: {
            type: Number,
            required: true,
        },
        frozen: {
            reason: String,
        },
    },
    { timestamps: true },
);

export const OldCampaignModel = (c: Connection) => c.model<OldCampaign & Document>('OldCampaign', OldCampaignSchema);

// Traveler

const stop = new mongoose.Schema(
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

export const TravelerSchema = new mongoose.Schema(
    {
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true,
        },
        world: {},
        origin: {},
        user: { type: String, required: true },
        prospect: { type: mongoose.Schema.Types.Mixed, required: true },
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

export const OldTravelerSchema = new mongoose.Schema(
    {
        campaign: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true,
        },
        world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: mongoose.Schema.Types.Mixed, required: true },
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
                    world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
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

export const OldTravelerModel = (c: Connection) => c.model<OldTraveler & Document>('OldTraveler', OldTravelerSchema);
