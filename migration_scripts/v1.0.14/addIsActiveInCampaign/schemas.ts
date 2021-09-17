import { Connection, Document, Schema } from 'mongoose';
import { historyNamesRecord, Prospect } from './interfaces';

const tagSchema: Schema = new Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
    user: { type: String, required: true },
    expiresAt: { type: Date, index: { expires: 0 } },
});

const DropContactEnrichment = new Schema({
    enrichmentDate: Date,
    civility: String,
    first_name: String,
    last_name: String,
    full_name: String,
    email: { type: [{ email: String, qualification: String }], _id: false },
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

const BirthdaySchema = new Schema(
    {
        month: Number,
        day: Number,
    },
    { _id: false },
);

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
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK', 'DISTANCE_-1'] },
        company: { type: { name: String, linkedinUrl: String, website: String } },
        status: { type: String, enum: ['connected', 'pending', 'not_connected', 'unknown'] },
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
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK', 'DISTANCE_-1'] },
        status: { type: String, enum: ['connected', 'pending', 'not_connected', 'unknown'] },
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
                        contentReference: { type: String },
                        connectedAt: { type: Number },
                        emailId: { type: String },
                        text: { type: String },
                        subject: { type: String },
                        sentAt: { type: Date },
                        campaignId: { type: String },
                        reason: { type: String },
                        fromMessageId: { type: String },
                        email: { type: String },
                    },
                },
            ],
            required: true,
            default: [],
            _id: false,
        },
        hasBeenEnriched: { type: Boolean },
        tags: {
            type: [{ type: tagSchema }],
            default: [],
        },
        origin: {
            type: {
                name: { type: String, required: true },
                trigger: String,
            },
            required: false,
        },
        countTryFetchStatus: { type: Number, required: false, default: 0 },
        isActiveInCampaign: { type: Boolean, default: false },
    },
    { timestamps: true },
);

export const ProspectModel = (c: Connection) => c.model<Prospect & Document>('Prospect', ProspectSchema);
