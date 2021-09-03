import { Connection, Document, Schema } from 'mongoose';
import {
    DuplicatedProspect,
    ICompany,
    IUser,
    IUserPermission,
    PermissionGroupName,
    PlanName,
    Profile,
    Prospect,
    seatStatuses,
    UsersRegroupment,
} from './interfaces';

// Stargate

const UserSchema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        occupation: { type: String },
        publicIdentifier: { type: String, required: true },
        memberId: { type: String, required: true },
        linkedinId: { type: String, required: true },
        profilePicture: { type: String },
        birthday: {
            month: { type: Number },
            day: { type: Number },
        },
        address: { type: String },
        email: { type: String },
        emailContact: { type: String },
        phoneNumbers: {
            type: [
                {
                    type: { type: String, required: true },
                    number: { type: String, required: true },
                },
            ],
        },
        language: { type: String, required: true },
        isTestUser: { type: Boolean },
        origins: {
            type: [
                {
                    date: { type: Date, required: true },
                    content: { type: String, required: true },
                },
            ],
            required: true,
            _id: false,
        },
        waapiId: {
            type: String,
        },
        hasBypass: { type: Boolean, required: false, default: false },
        freeTrial: {
            startDate: { type: Date },
            endDate: { type: Date },
        },
        hasExtensionInstalled: { type: Boolean, required: false, default: false },
        dateExtensionUninstall: { type: Date, required: false },
    },
    { timestamps: true },
);

export const UserModel = (c: Connection) => c.model<IUser & Document>('User', UserSchema);

// Bouncer

export const PlanSchema = new Schema(
    {
        name: { type: String, required: true },
        expirationDate: { type: Date },
        startDate: { type: Date, required: true },
        periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
    },
    { _id: false },
);

const SeatSchema = new Schema(
    {
        plan: PlanSchema,
        status: { type: String, enum: seatStatuses, required: true },
        user: { type: String },
    },
    { timestamps: true, _id: true },
);

const CompanySchema = new Schema(
    {
        name: { type: String, required: true },
        owner: { type: String, required: true, unique: true },
        seats: { type: [SeatSchema], required: true },
    },
    { timestamps: true, _id: true },
);

export const CompanyModel = (c: Connection) => c.model<ICompany & Document>('Company', CompanySchema);

const UserPermissionSchema = new Schema(
    {
        user: { type: String, required: true, unique: true },
        waapiId: { type: String, required: true, unique: true },
        paymentWaapiId: { type: String, required: true },
        permissions: {
            included: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
                _id: false,
            },
            excluded: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
                _id: false,
            },
        },
        metadatas: {
            type: [
                {
                    date: { type: Date, required: true },
                    type: { type: String, enum: ['resume_free_trial', 'new_free_trial'], required: true },
                },
            ],
        },
        plan: PlanSchema,
        trial: {
            type: {
                planName: { type: String, required: true },
                expirationDate: { type: Date },
                startDate: { type: Date, required: true },
            },
        },
        hasPaidAtLeastOnce: { type: Boolean, default: false, required: false },
        subscriptionState: {
            isActive: { type: Boolean, required: false },
            stoppedAt: { type: Date, required: false },
        },
        company: {
            type: {
                _id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
                plan: PlanSchema,
                isOwner: { type: Boolean, required: true },
            },
            required: false,
        },
    },
    { timestamps: true },
);

export const UserPermissionsModel = (c: Connection) =>
    c.model<IUserPermission<PermissionName, PermissionGroupName, PlanName> & Document>('UserPermission', UserPermissionSchema);

// Goulag

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
        countTryFetchStatus: { type: Number, required: false, default: 0 },
    },
    { timestamps: true },
);

export const ProspectModel = (c: Connection) => c.model<Prospect & Document>('Prospect', ProspectSchema);

const usersRegroupmentSchema = new Schema({
    company: { type: String, required: false },
    users: { type: [String], required: true },
});

export const UsersRegroupmentModel = (c: Connection) => c.model<UsersRegroupment & Document>('UsersRegroupment', usersRegroupmentSchema);

const duplicatedProspectSchema = new Schema({
    profile: { type: ProfileSchema, required: true },
    prospects: {
        type: [
            {
                _id: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
                user: { type: String, required: true },
            },
        ],
        required: true,
    },
    usersRegroupment: { type: Schema.Types.ObjectId, ref: 'UsersRegroupment', required: true },
});

export const DuplicatedProspectModel = (c: Connection) => c.model<DuplicatedProspect & Document>('DuplicatedProspect', duplicatedProspectSchema);
