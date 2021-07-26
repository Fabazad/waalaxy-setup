import fs from 'fs';
import _ from 'lodash';
import mongoose, { Schema } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const DropContactEnrichment = new Schema({
    enrichmentDate: Date,
    civility: String,
    first_name: String,
    last_name: String,
    full_name: String,
    email: { type: [{ email: String, qualification: String }] },
    phone: String,
    mobile_phone: String,
    company: String,
    website: String,
    linkedin: String,
    company_infogreffe: String,
    siren: String,
    siret: String,
    vat: String,
    nb_employees: String,
    naf5_code: String,
    naf5_des: String,
    siret_address: String,
    siret_zip: String,
    siret_city: String,
    company_linkedin: String,
    company_turnover: String,
    company_results: String,
});

const BirthdaySchema = new Schema({
    month: Number,
    day: Number,
});

const phoneNumberSchema = new Schema({
    type: { type: Schema.Types.String },
    number: String,
});

const ProfileSchema = new Schema(
    {
        publicIdentifier: String,
        memberId: String,
        salesMemberId: String,
        linkedinId: Number,
        firstName: String,
        lastName: String,
        occupation: String,
        profilePicture: String,
        influencer: { type: Boolean, default: false },
        jobSeeker: { type: Boolean, default: false },
        openLink: { type: Boolean, default: false },
        premium: { type: Boolean, default: false },
        profileUrl: String,
        region: String,
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        company: { type: { name: String, linkedinUrl: String, website: String } },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        birthday: BirthdaySchema,
        address: String,
        connectedAt: Date,
        email: String,
        phoneNumbers: [phoneNumberSchema],
        dropContactEnrichment: DropContactEnrichment,
    },
    { timestamps: true },
);

const CustomProfileSchema = new Schema({
    firstName: { type: Schema.Types.String },
    lastName: { type: Schema.Types.String },
    occupation: { type: Schema.Types.String },
    company: { type: { name: String, linkedinUrl: String, website: String } },
    email: { type: Schema.Types.String },
    phoneNumbers: [phoneNumberSchema],
    region: { type: Schema.Types.String },
    birthday: BirthdaySchema,
});

const ProspectSchema = new Schema(
    {
        profile: { type: ProfileSchema, required: true },
        customProfile: { type: CustomProfileSchema },
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

const ActionHistorySchema = new mongoose.Schema(
    {
        type: { type: String, enum: actionTypes, required: true },
        user: { type: String, required: true },
        priority: { type: Number, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['success', 'fail'], required: true },
        wasMovedByUser: { type: Boolean },
        campaign: { type: String, required: true },
        executionDate: { type: Date },
        statusCode: { type: Number, required: false },
        failReason: { required: false },
        action: { type: Schema.Types.ObjectId, ref: 'Action', required: true },
    },
    { timestamps: true },
);

const ContentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        channel: { type: String, required: true },
        type: { type: String, required: true },
        user: { type: String, required: true },
        params: {
            noteContent: { type: String, required: false },
            messageContent: { type: String, required: false },
            emailSubject: { type: String, required: false },
            emailContent: { type: String, required: false },
        },
    },
    { timestamps: true },
);

const transformToMap = (array: Array<{ _id: string }>): Record<string, any> => {
    return array.reduce((acc, value) => {
        return {
            ...acc,
            [value._id]: value,
        };
    }, {});
};

export const getContentRepliedRate = async () => {
    console.log('Starting getContentRepliedRate');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const shivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);
    const voltaireDatabase = await loginToDatabase(process.env.VOLTAIRE_DATABASE!);

    const Prospect = goulagDatabase.model<any & mongoose.Document>('Prospect', ProspectSchema);
    const Action = shivaDatabase.model<any & mongoose.Document>('Action', ActionSchema);
    const ActionHistory = shivaDatabase.model<any & mongoose.Document>('ActionHistory', ActionHistorySchema);
    const Content = voltaireDatabase.model<any & mongoose.Document>('Content', ContentSchema);

    const prospects = await Prospect.find(
        {
            $or: [
                {
                    'history.name': 'linkedin_connect',
                },
                {
                    'history.name': 'linkedin_message',
                },
            ],
            createdAt: { $gt: '2021-06-10T14:13:14.691Z' },
        },
        { history: true },
    ).lean();
    console.log(`${prospects.length} found`);

    type RepliedAcceptedSentData = {
        note: { [key: string]: { accepted: number; sent: number } };
        message: { [key: string]: { sent: number; replied: number } };
    };

    const results = prospects.reduce<RepliedAcceptedSentData>(
        (result, prospect) => {
            console.log(prospect.history.length);
            const connects: Array<string> = [];
            const messages: Array<string> = [];
            (prospect.history as Array<any>).forEach((current: any) => {
                if (current.name === 'linkedin_connect') {
                    connects.push(current.action);
                    if (result.note[current.action]) {
                        result.note[current.action].sent = result.note[current.action].sent + 1;
                    } else {
                        result.note[current.action] = { sent: 1, accepted: 0 };
                    }
                }
                if (current.name === 'linkedin_message') {
                    messages.push(current.action);
                    if (result.message[current.action]) {
                        result.message[current.action].sent = result.message[current.action].sent + 1;
                    } else {
                        result.message[current.action] = { sent: 1, replied: 0 };
                    }
                }
                if (current.name === 'relationship_connection') {
                    connects.forEach((connect) => {
                        result.note[connect].accepted = result.note[connect].accepted + 1;
                    });
                }
                if (current.name === 'message_replied') {
                    messages.forEach((message) => {
                        result.message[message].replied = result.message[message].replied + 1;
                    });
                }
            });
            return result;
        },
        { message: {}, note: {} },
    );
    console.log({ messages: Object.keys(results.message).length, notes: Object.keys(results.note).length });
    const actionIds = [...Object.keys(results.note), ...Object.keys(results.message)];

    const chunks = _.chunk(actionIds, 10000);
    const actions: Array<any> = [];
    const actionsHistories: Array<any> = [];
    await Promise.all(
        chunks.map(async (chunk) => {
            actions.push(...(await Action.find({ _id: { $in: chunk } }).lean()));
            actionsHistories.push(...(await ActionHistory.find({ action: { $in: chunk } }).lean()));
        }),
    );

    const contentReferences = [...actions, ...actionsHistories]
        .filter((action) => action?.params?.contentReference && action?.params?.contentReference.length === 24)
        .map((action) => action?.params?.contentReference);

    console.log({ actions: actions.length });
    console.log({ actionsHistories: actionsHistories.length });
    console.log({ contentReferences: contentReferences.length });

    const contents = await Content.find({ _id: { $in: contentReferences }, createdAt: { $gt: '2021-06-10T14:13:14.691Z' } }).lean();
    console.log(contents.length, 'contents found');
    const contentsMap = transformToMap(contents as any);

    [...actions, ...actionsHistories]
        .filter((action) => action?.params?.contentReference && contentsMap[action.params.contentReference])
        .forEach((action) => {
            const accepted = (results[action.type.toLowerCase().includes('connect') ? 'note' : 'message'][action._id] as any)?.accepted || 0;
            const replied = (results[action.type.toLowerCase().includes('connect') ? 'note' : 'message'][action._id] as any)?.replied || 0;
            contentsMap[action.params.contentReference] = {
                ...contentsMap[action.params.contentReference],
                sent:
                    (contentsMap[action.params.contentReference].sent || 0) +
                        results[action.type.toLowerCase().includes('connect') ? 'note' : 'message'][action._id]?.sent || 0,
                accepted: accepted
                    ? (contentsMap[action.params.contentReference].accepted || 0) + accepted
                    : contentsMap[action.params.contentReference].accepted,
                replied: replied
                    ? (contentsMap[action.params.contentReference].replied || 0) + replied
                    : contentsMap[action.params.contentReference].replied,
            };
        }) as any;

    const sanityzedContentsMap = Object.values(contentsMap)
        .filter((content) => typeof content.sent !== 'undefined' && content.sent !== 0)
        .map((content) => {
            return {
                content: content?.params?.noteContent || content?.params?.messageContent,
                accepted: typeof content.accepted !== 'undefined' ? content.accepted : content?.params?.noteContent ? 0 : undefined,
                sent: content.sent,
                replied: typeof content.replied !== 'undefined' ? content.replied : content?.params?.messageContent ? 0 : undefined,
            };
        });

    console.log(sanityzedContentsMap.length);

    await new Promise((resolve) =>
        fs.writeFile('./dataset/replied_or_accepted_complete_dataset.json', JSON.stringify(sanityzedContentsMap), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            fs.writeFile('./dataset/replied_or_accepted_sliced_dataset.json', JSON.stringify(sanityzedContentsMap.slice(0, 100)), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Done replies');
                resolve(undefined);
            });
        }),
    );
};

getContentRepliedRate();
