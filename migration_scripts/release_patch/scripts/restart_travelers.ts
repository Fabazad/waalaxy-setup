import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

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

const TravelerSchema = new mongoose.Schema(
    {
        campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
        world: { type: mongoose.Schema.Types.ObjectId, ref: 'World', required: true },
        origin: { type: mongoose.Schema.Types.ObjectId, ref: 'Origin', required: true },
        user: { type: String, required: true },
        prospect: { type: mongoose.Schema.Types.Mixed, required: true },
        status: {
            value: { type: String, enum: ['traveling', 'paused', 'stopped', 'error', 'finished'], required: true },
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

const DistributedEventSchema = new mongoose.Schema(
    {
        channel: { type: String, required: true },
        author: { type: String, required: true },
        payload: { type: [{}], required: true },
    },
    { timestamps: true },
);

const linkedinActions = ['messageLinkedin', 'connectLinkedin', 'visitLinkedin', 'followLinkedin'];

const buildEventRequest = (
    type: 'messageLinkedin' | 'connectLinkedin' | 'visitLinkedin' | 'followLinkedin' | 'enrichment' | 'webhook' | 'email',
    id: string,
) => {
    if (linkedinActions.includes(type)) return [`LINKEDIN_ACTION_SUCCEEDED/entityId/${id}`, `LINKEDIN_ACTION_FAILED/entityId/${id}`];
    if (type === 'enrichment') return [`PROSPECT_ENRICHED_SUCCESS/entityId/${id}`, `PROSPECT_ENRICHED_ERROR/entityId/${id}`];
    if (type === 'webhook') return [`WEBHOOK_ACTION_SUCCEEDED/entityId/${id}`, `WEBHOOK_ACTION_FAILED/entityId/${id}`];
    if (type === 'email') return [`EMAIL_ACTION_SUCCEEDED/entityId/${id}`, `EMAIL_ACTION_FAILED/entityId/${id}`];
};

const conditionPipeline = [
    {
        $match: {
            'status.value': 'traveling',
            'currentStop.status.value': 'waiting_for_validation',
            'currentStop.type': {
                $in: [...linkedinActions, 'email', 'enrichment', 'webhook'],
            },
        },
    },
    {
        $addFields: {
            lastElem: { $last: '$history' },
        },
    },
    {
        $match: {
            'lastElem.type': 'queued_action',
            'lastElem.action._id': { $exists: true },
        },
    },
];

export const restartTravelers = async () => {
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const Traveler = profesorDatabase.model<any & mongoose.Document>('Traveler', TravelerSchema);

    const ottoDatabase = await loginToDatabase(process.env.OTTO_DATABASE!);
    const DistributedEvents = ottoDatabase.model<any & mongoose.Document>('DistributedEvent', DistributedEventSchema);

    console.log('Fetching total');
    const [{ total }] = await Traveler.aggregate([...conditionPipeline, { $count: 'total' }]);

    let current = 0;
    const pageSize = 1000;
    let eventsCount = {
        total: 0,
        linkedin: {
            success: 0,
            failed: 0,
        },
        email: {
            success: 0,
            failed: 0,
        },
        webhook: {
            success: 0,
            failed: 0,
        },
        enrichment: {
            success: 0,
            failed: 0,
        },
    };

    while (current < total) {
        console.log(`Processing ${current}/${total}`);

        const travelers = await Traveler.aggregate([...conditionPipeline, { $skip: current }, { $limit: pageSize }]);

        const processedTravelers = travelers.map((traveler) => {
            const actionId = traveler.lastElem.action._id;
            const actionType = traveler.currentStop.type;
            const request = buildEventRequest(actionType, actionId);
            return { travelerId: traveler._id, actionId, actionType, request };
        });

        const $in = processedTravelers.flatMap((t) => t.request);

        const events = await DistributedEvents.find({
            channel: { $in },
        });

        eventsCount.total += events.length;
        events.forEach((event) => {
            if (event.channel.includes('LINKEDIN_ACTION_SUCCEEDED')) eventsCount.linkedin.success += 1;
            if (event.channel.includes('LINKEDIN_ACTION_FAILED')) eventsCount.linkedin.failed += 1;
            if (event.channel.includes('EMAIL_ACTION_SUCCEEDED')) eventsCount.email.success += 1;
            if (event.channel.includes('EMAIL_ACTION_FAILED')) eventsCount.email.success += 1;
            if (event.channel.includes('PROSPECT_ENRICHED_SUCCESS')) eventsCount.enrichment.success += 1;
            if (event.channel.includes('PROSPECT_ENRICHED_ERROR')) eventsCount.enrichment.failed += 1;
            if (event.channel.includes('WEBHOOK_ACTION_SUCCEEDED')) eventsCount.webhook.success += 1;
            if (event.channel.includes('WEBHOOK_ACTION_FAILED')) eventsCount.webhook.failed += 1;
        });

        console.log(eventsCount);

        current += pageSize;
    }
    console.log('Done');
};
