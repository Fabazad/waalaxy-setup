import { Connection, Document, model, Schema } from 'mongoose';
import {historyNamesRecord, Prospect, Profile, IDropContactEnrichment} from './interfaces';

export const DropContactEnrichment = new Schema({
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

export const BirthdaySchema = new Schema(
    {
        month: Number,
        day: Number,
    },
    { _id: false },
);

export const phoneNumberSchema = new Schema({
    type: { type: Schema.Types.String },
    number: String,
});

export const ProfileSchema = new Schema(
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

export const ProfileModel = (c: Connection) => c.model<Profile & Document>('Profile', ProfileSchema);

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



const DropContactEnrichmentSchema = new Schema(
    {
        dataToEnrich: {
            email: { type: String },
            first_name: { type: String },
            last_name: { type: String },
            full_name: { type: String },
            phone: { type: String },
            company: { type: String },
            website: { type: String },
            num_siren: { type: String },
        },
        user: { type: String, required: true },
        prospect: { type: String, required: true },
        status: {
            type: String,
            enum: ['to_process', 'processing', 'processed', 'error'],
            required: true,
        },
        requestId: { type: String },
        enrichementResult: {
            civility: { type: String },
            first_name: { type: String },
            last_name: { type: String },
            full_name: { type: String },
            email: {
                type: [
                    {
                        _id: false,
                        email: { type: String },
                        qualification: { type: String },
                    },
                ],
            },
            phone: { type: String },
            mobile_phone: { type: String },
            company: { type: String },
            website: { type: String },
            linkedin: { type: String },
            company_infogreffe: { type: String },
            siren: { type: String },
            siret: { type: String },
            vat: { type: String },
            nb_employees: { type: String },
            naf5_code: { type: String },
            naf5_des: { type: String },
            siret_address: { type: String },
            siret_zip: { type: String },
            siret_city: { type: String },
            company_linkedin: { type: String },
            company_turnover: { type: String },
            company_results: { type: String },
        },
    },
    { timestamps: true },
);

export const EnrichmentModel = (c: Connection) => c.model<IDropContactEnrichment & Document>('DropContactEnrichment', DropContactEnrichmentSchema);
