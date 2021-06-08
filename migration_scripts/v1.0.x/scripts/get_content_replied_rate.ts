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
                    'history.name': 'message_replied',
                },
                {
                    'history.name': 'relationship_connection',
                },
            ],
        },
        { history: true },
    ).lean();
    console.log(`${prospects.length} found`);

    const filteredProspects = prospects.filter((prospect) => {
        const { isValid } = prospect.history.reduce(
            (acc: any, current: any) => {
                if (current.name === 'relationship_connection' && acc.hasSentConnect) return { ...acc, isValid: true };
                if (current.name === 'message_replied' && acc.hasSentMessage) return { ...acc, isValid: true };
                if (current.name === 'linkedin_connect') return { ...acc, hasSentConnect: true };
                if (current.name === 'linkedin_message') return { ...acc, hasSentMessage: true };
                return acc;
            },
            {
                hasSentConnect: false,
                hasSentMessage: false,
                isValid: false,
            },
        );
        return isValid;
    });
    console.log({ filteredProspects: filteredProspects.length });
    const actionIds = [];
    for (const prospect of filteredProspects) {
        actionIds.push(
            ...prospect.history
                .filter((element: any) => element.name === 'linkedin_connect' || element.name === 'linkedin_message')
                .map((element: any) => element.action)
                .filter(Boolean),
        );
    }

    const actions = await Action.find({ _id: { $in: actionIds } }).lean();
    const actionsHistories = await ActionHistory.find({ action: { $in: actionIds } }).lean();

    const contentReferences = [...actions, ...actionsHistories]
        .filter((action) => action?.params?.contentReference && action?.params?.contentReference.length === 24)
        .map((action) => action?.params?.contentReference);

    console.log({ actions: actions.length });
    console.log({ actionsHistories: actionsHistories.length });
    console.log({ contentReferences: contentReferences.length });

    const contents = await Content.find({ _id: { $in: contentReferences } }).lean();

    const contentsMap = transformToMap(contents as any);

    const actionsMap = transformToMap(
        actions
            .filter((action) => action?.params?.contentReference && contentsMap[action.params.contentReference])
            .map((action) => ({
                ...action,
                params: {
                    ...action.params,
                    contentReference: contentsMap[action.params.contentReference],
                },
            })) as any,
    );
    const actionsHistoriesMap = transformToMap(
        actionsHistories
            .filter((action) => action?.params?.contentReference && contentsMap[action.params.contentReference])
            .map((action) => ({
                ...action,
                params: {
                    ...action.params,
                    contentReference: contentsMap[action.params.contentReference],
                },
            })) as any,
    );

    const populatedProspects = filteredProspects.reduce((acc: Array<any>, prospect: any) => {
        const sanityzedHistory = _.uniqWith(prospect.history, function (e: any, a: any) {
            if (e.name === 'message_seen' && a.name === 'message_seen') return a?.params?.messageId === a?.params?.messageId;
            if (e.name === 'message_replied' && a.name === 'message_replied') return a?.params?.messageId === a?.params?.messageId;
            if (e.name === 'relationship_connection' && a.name === 'relationship_connection')
                return a?.params?.connectedAt === a?.params?.connectedAt;
            return false;
        });
        const hasContentReference = sanityzedHistory.some(
            (element) =>
                ((element.name === 'linkedin_connect' || element.name === 'linkedin_message') && actionsMap[element.action]) ||
                actionsHistoriesMap[element.action],
        );
        if (!hasContentReference) return acc;
        return [
            ...acc,
            {
                ...prospect,
                history: sanityzedHistory.map((element: any) => {
                    return element.name === 'linkedin_connect' || element.name === 'linkedin_message'
                        ? {
                              ...element,
                              action: actionsMap[element.action] || actionsHistoriesMap[element.action],
                          }
                        : element;
                }),
            },
        ];
    }, []);

    console.log({ prospectWithAtLeastOnePopulatedContent: populatedProspects.length });

    await new Promise((resolve) =>
        fs.writeFile('./dataset/replied_or_accepted_complete_dataset.json', JSON.stringify(populatedProspects), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            fs.writeFile('./dataset/replied_or_accepted_sliced_dataset.json', JSON.stringify(populatedProspects.slice(0, 100)), (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('Done replies');
                resolve(undefined);
            });
        }),
    );
    console.log('Starting no replies');

    const prospectWithNoReplies = await Prospect.find(
        {
            'history.name': { $nin: ['message_replied', 'relationship_connection'], $in: ['linkedin_message', 'linkedin_connect'] },
        },
        { history: true },
    )
        .limit(50000)
        .lean();

    const noRepliesActionIds = [];
    for (const prospect of prospectWithNoReplies) {
        noRepliesActionIds.push(
            ...prospect.history
                .filter((element: any) => element.name === 'linkedin_connect' || element.name === 'linkedin_message')
                .map((element: any) => element.action)
                .filter(Boolean),
        );
    }

    const noRepliesActions = await Action.find({ _id: { $in: noRepliesActionIds } }).lean();
    const noRepliesActionsHistories = await ActionHistory.find({ action: { $in: noRepliesActionIds } }).lean();

    const noRepliesContentReferences = [...noRepliesActions, ...noRepliesActionsHistories]
        .filter((action) => action?.params?.contentReference && action?.params?.contentReference.length === 24)
        .map((action) => action?.params?.contentReference);

    console.log({ noRepliesActions: noRepliesActions.length });
    console.log({ noRepliesActionsHistories: noRepliesActionsHistories.length });
    console.log({ noRepliesContentReferences: noRepliesContentReferences.length });

    const noRepliesContents = await Content.find({ _id: { $in: noRepliesContentReferences } }).lean();

    const noRepliesContentsMap = transformToMap(noRepliesContents as any);

    const noRepliesActionsMap = transformToMap(
        noRepliesActions
            .filter((action) => action?.params?.contentReference && noRepliesContentsMap[action.params.contentReference])
            .map((action) => ({
                ...action,
                params: {
                    ...action.params,
                    contentReference: noRepliesContentsMap[action.params.contentReference],
                },
            })) as any,
    );
    const noRepliesActionsHistoriesMap = transformToMap(
        noRepliesActionsHistories
            .filter((action) => action?.params?.contentReference && noRepliesContentsMap[action.params.contentReference])
            .map((action) => ({
                ...action,
                params: {
                    ...action.params,
                    contentReference: contentsMap[action.params.contentReference],
                },
            })) as any,
    );

    const noRepliesPopulatedProspects = prospectWithNoReplies.reduce((acc: Array<any>, prospect: any) => {
        const sanityzedHistory = _.uniqWith(prospect.history, function (e: any, a: any) {
            if (e.name === 'message_seen' && a.name === 'message_seen') return a?.params?.messageId === a?.params?.messageId;
            if (e.name === 'message_replied' && a.name === 'message_replied') return a?.params?.messageId === a?.params?.messageId;
            if (e.name === 'relationship_connection' && a.name === 'relationship_connection')
                return a?.params?.connectedAt === a?.params?.connectedAt;
            return false;
        });
        const hasContentReference = sanityzedHistory.some(
            (element) =>
                ((element.name === 'linkedin_connect' || element.name === 'linkedin_message') && noRepliesActionsMap[element.action]) ||
                noRepliesActionsHistoriesMap[element.action],
        );
        if (!hasContentReference) return acc;
        return [
            ...acc,
            {
                ...prospect,
                history: sanityzedHistory.map((element: any) => {
                    return element.name === 'linkedin_connect' || element.name === 'linkedin_message'
                        ? {
                              ...element,
                              action: noRepliesActionsMap[element.action] || noRepliesActionsHistoriesMap[element.action],
                          }
                        : element;
                }),
            },
        ];
    }, []);

    console.log({ prospectWithAtLeastOnePopulatedContent: noRepliesPopulatedProspects.length });

    fs.writeFile('./dataset/no_reply_or_accept_complete_dataset.json', JSON.stringify(noRepliesPopulatedProspects), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFile('./dataset/no_reply_or_accept_sliced_dataset.json', JSON.stringify(noRepliesPopulatedProspects.slice(0, 100)), (err) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('Done');
        });
    });
};

getContentRepliedRate();
