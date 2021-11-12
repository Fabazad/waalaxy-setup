import { Connection, Document, Schema } from 'mongoose';
import { IProspectList } from './interface';
import { ICompany, IUser, IUserPermission, PermissionGroupName, PlanName, seatStatuses } from './interfaces';

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

const ProspectListSchema = new Schema(
    {
        user: Schema.Types.ObjectId,
        name: String,
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
);

export const ProspectListModel = (c: Connection) => c.model<IProspectList & Document>('ProspectListSchema', ProspectListSchema, 'prospectlists');
