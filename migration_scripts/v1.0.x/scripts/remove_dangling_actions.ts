import _ from 'lodash';
import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';
import { Stop, TravelStatesItem } from '../../release_patch/scripts/update_traveler_paths_and_stops';

const TRAVELER_STATUSES = ['traveling', 'paused', 'stopped', 'error', 'finished'] as const;
type TravelerStatus = { value: typeof TRAVELER_STATUSES[number]; reason?: string };

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
        },
    },
    { _id: false },
);

export declare type ITraveler<
    A = mongoose.Schema.Types.ObjectId,
    B = mongoose.Schema.Types.ObjectId,
    C = mongoose.Schema.Types.ObjectId,
    D = string,
> = {
    campaign: A;
    world: B;
    origin: C;
    user: string;
    prospect: D;
    currentStop?: Stop;
    status: TravelerStatus;
    history: Array<any>;
    travelStates: Array<TravelStatesItem<B>>;
} & {
    _id: mongoose.Schema.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
};

const TravelerSchema = new mongoose.Schema(
    {
        campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: mongoose.Schema.Types.Mixed, required: true },
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
                    world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
                    arrivalDate: { type: Date, required: true },
                    leaveDate: { type: Date },
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

export const ACTION_TYPES = {
    FOLLOW_LINKEDIN: 'followLinkedin',
    MESSAGE_LINKEDIN: 'messageLinkedin',
    VISIT_LINKEDIN: 'visitLinkedin',
    CONNECT_LINKEDIN: 'connectLinkedin',
} as const;
export const actionTypes = Object.values(ACTION_TYPES);
export type ActionType = typeof actionTypes[number];

export const ACTION_STATUSES = {
    SUCCESS: 'success',
    FAIL: 'fail',
    WAITING: 'waiting',
    DELIVERED: 'delivered',
    RETRY: 'retry',
    FROZEN: 'frozen',
} as const;
export const actionStatuses = Object.values(ACTION_STATUSES);
export type ActionStatus = typeof actionStatuses[number];
export const SCHEDULE_DAYS = {
    TODAY: 'today',
    ANOTHER_DAY: 'another_day',
} as const;
export const scheduleDays = Object.values(SCHEDULE_DAYS);
export type ScheduleDay = typeof scheduleDays[number];

const actionParams = new mongoose.Schema({
    message: { type: String, required: false },
    contentReference: { type: String, required: false },
    note: { type: String, required: false },
    prospectHasEmail: { type: Boolean, required: false },
});

const actionResult = new mongoose.Schema({
    messageId: { type: String, required: false },
});

const ActionSchema = new mongoose.Schema(
    {
        type: { type: String, enum: actionTypes, required: true },
        user: { type: String, required: true },
        priority: { type: Number, required: true },
        prospect: { type: String, required: true },
        position: { type: Number, required: false },
        scheduleDay: {
            type: String,
            enum: scheduleDays,
            required: false,
        },
        status: {
            type: String,
            enum: actionStatuses,
            required: true,
        },
        statusCode: { type: Number, required: false },
        failReason: { required: false },
        wasMovedByUser: { type: Boolean },
        campaign: { type: String, required: true },
        nextTry: { type: Date, required: false },
        executionDate: { type: Date, required: false },
        deliveredDate: { type: Date, required: false },
        params: {
            type: actionParams,
            required: false,
        },
        result: {
            type: actionResult,
            required: false,
        },
    },
    { timestamps: true },
);

export const getDanglingActions = async () => {
    console.log('Starting getDanglingActions');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const shivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);
    const Traveler = profesorDatabase.model<any & mongoose.Document>('Traveler', TravelerSchema);
    const Action = shivaDatabase.model<any & mongoose.Document>('Action', ActionSchema);

    const actions = await Action.find({ status: { $in: ['waiting', 'retry', 'delivered', 'frozen'] } })
        .lean()
        .select({ prospect: 1 });

    const dangling = [];

    const chunkSize = 1000;

    const chunked = _.chunk(actions, chunkSize);

    let i = 0;
    for await (const chunk of chunked) {
        const travelers = await Traveler.find({ prospect: { $in: chunk.map((c) => c.prospect) }, status: { value: 'traveling' } }).select({
            'status.value': 1,
            prospect: 1,
        });
        dangling.push(...chunk.filter((action) => !travelers.some((t) => t.prospect === action.prospect)));
        console.log(`${i * chunkSize}/${actions.length}`);
        i++;
    }
    console.log(`Found ${dangling.length} dangling actions`);

    let j = 0;
    const chunkedActions = _.chunk(dangling, chunkSize);
    for await (const chunk of chunkedActions) {
        await Action.deleteMany({ _id: { $in: chunk.map((c) => c._id) } });
        console.log(`Deleted ${j * chunkSize}/${dangling.length}`);
        j++;
    }

    console.log('Done');
};

getDanglingActions();
