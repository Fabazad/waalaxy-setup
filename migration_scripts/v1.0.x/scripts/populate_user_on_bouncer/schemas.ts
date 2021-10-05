import { Schema, Document, Connection } from 'mongoose';
import { IUser, IUserPermission, PermissionGroupName, PlanName } from './interfaces';

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
        company: {
            name: { type: String, required: false },
            linkedinUrl: { type: String, required: false },
            website: { type: String, required: false },
            staffCount: { type: Number, required: false },
        },
    },
    { timestamps: true },
);

export const UserModel = (c: Connection) => c.model<IUser & Document>('User', UserSchema);

const UserStargateSchema = {
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
    company: {
        name: { type: String, required: false },
        linkedinUrl: { type: String, required: false },
        website: { type: String, required: false },
        staffCount: { type: Number, required: false },
    },
};

const UserPermissionSchema = new Schema(
    {
        userData: UserStargateSchema,
        user: { type: String, required: true, unique: true },
        waapiId: { type: String, required: true, unique: true },
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
        plan: {
            name: { type: String, required: true },
            expirationDate: { type: Date },
            startDate: { type: Date, required: true },
            periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
        },
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
    },
    { timestamps: true },
);

export const UserPermissionModel = (c: Connection) =>
    c.model<IUserPermission<PermissionName, PermissionGroupName, PlanName> & Document>('UserPermission', UserPermissionSchema);
