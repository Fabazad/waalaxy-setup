import { Connection, Document, Schema } from 'mongoose';
import { ProspectList, IOrigin, ITraveler, TRAVELER_STATUSES, historyNamesRecord, Prospect } from './interfaces';

const prospectListSchema: Schema = new Schema({
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, required: true },
    expiresAt: { type: Date, index: { expires: 0 } },
});

export const ProspectListModel = (c: Connection) => c.model<ProspectList & Document>('ProspectList', prospectListSchema);

export const possibleOrigins = {
    trigger: 'trigger' as const,
    prospect_batch: 'prospect_batch' as const,
};

const OriginSchema = new Schema(
    {
        origin: { type: String, required: true, enum: Object.values(possibleOrigins) },
        travelerCount: { type: Number, required: true },
        trigger: { type: String },
        prospectList: { type: String },
    },
    { timestamps: true },
);

export const OriginModel = (c: Connection) => c.model<IOrigin & Document>('Origin', OriginSchema);

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

const TravelerSchema = new Schema(
    {
        campaign: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: Schema.Types.Mixed, required: true },
        status: {
            value: { type: String, enum: TRAVELER_STATUSES, required: true },
            reason: { type: String },
        },
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

export const TravelerModel = (c: Connection) => c.model<ITraveler & Document>('Traveler', TravelerSchema);

const ProspectSchema = new Schema(
    {
        prospectList: { type: Schema.Types.ObjectId, ref: 'ProspectList', required: true },
        user: { type: Schema.Types.ObjectId, required: true },
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        expiresAt: { type: Date, index: { expires: 0 } },
        customData: { type: {}, default: {} },
        oneToOneConversationId: { type: String },
        isRepliedMonitored: { type: Boolean, default: false },
        isSeenMonitored: { type: Boolean, default: false },
        history: {
            type: [
                {
                    action: { type: String },
                    executionDate: { type: Date, required: true },
                    name: {
                        type: String,
                        required: true,
                        enum: Object.values(historyNamesRecord),
                    },
                    params: {
                        messageContent: { type: String },
                        messageId: { type: String },
                        connectedAt: { type: Number },
                        emailId: { type: String },
                        text: { type: String },
                        subject: { type: String },
                        sentAt: { type: Date },
                    },
                },
            ],
            default: [],
        },
        hasBeenEnriched: { type: Boolean },
        tags: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Tag', required: false }],
            required: false,
            default: [],
        },
        origin: {
            type: {
                name: { type: String, required: true },
                trigger: String,
            },
            required: false,
        },
    },
    { timestamps: true },
);

export const ProspectModel = (c: Connection) => c.model<Prospect & Document>('Prospect', ProspectSchema);
