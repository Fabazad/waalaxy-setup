import { Connection, Document, Schema } from 'mongoose';
import { IMetadataGoulag, IMetadataHermes, IMetadataShiva, IUserBouncer, IUserLilith, IUserStargate } from './interfaces';
import PermissionName from '../../../back/services/bouncer/src/helpers/types/PermissionName.types';
import PermissionGroupName from '../../../back/services/bouncer/src/helpers/types/PermissionGroupName.types';
import PlanName from '../../../back/services/bouncer/src/helpers/types/PlanName.types';

/**
 * User lilith
 */
const UserLilithSchema = new Schema(
    {
        user: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        occupation: { type: String, required: true },
        publicIdentifier: { type: String, required: true },
        memberId: { type: String, required: true },
        linkedinId: { type: String, required: true },
        profilePicture: { type: String },
        birthday: {
            month: { type: Number },
            day: { type: Number },
        },
        address: { type: String },
        email: { type: String, required: true },
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
        origins: {
            type: [
                {
                    date: { type: Date, required: true },
                    content: { type: String, required: true },
                },
            ],
            required: true,
        },
        hasBypass: { type: Boolean, default: false },
        hasExtensionInstalled: { type: Boolean, default: false },
        dateExtensionUninstall: { type: Date },
        isPremiumSubscriber: { type: Boolean, default: false },
        kpi: {
            firstProspectCreatedDate: { type: Date },
            firstLinkedInActionDate: { type: Date },
            firstMailDate: { type: Date },
        },
        waapiId: { type: String, unique: true },
        paymentWaapiId: { type: String, unique: true },
        plan: {
            name: { type: String },
            expirationDate: { type: Date },
            startDate: { type: Date },
            periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'] },
        },
        trial: {
            planName: { type: String },
            expirationDate: { type: Date },
            startDate: { type: Date },
        },
        hasPaidAtLeastOnce: { type: Boolean, required: false, default: false },
        firstPaidAt: { type: Date, required: false },
        lastPaidAt: { type: Date, required: false },
        subscriptionState: {
            isActive: { type: Boolean },
            stoppedAt: { type: Date },
        },
    },
    { timestamps: true },
);

export const UserLilithModel = (c: Connection) => c.model<IUserLilith & Document>('User', UserLilithSchema);

/**
 * User stargate
 */
const UserStargateSchema = new Schema(
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
        isPremiumSubscriber: { type: Boolean },
    },
    { timestamps: true },
);

export const UserStargateModel = (c: Connection) => c.model<IUserStargate & Document>('User', UserStargateSchema);

/**
 * User bouncer
 */
const UserBouncerSchema = new Schema(
    {
        user: { type: String, required: true, unique: true },
        waapiId: { type: String, required: true, unique: true },
        paymentWaapiId: { type: String, required: true },
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
        firstPaidAt: { type: Date, required: false },
        lastPaidAt: { type: Date, required: false },
        subscriptionState: {
            isActive: { type: Boolean, required: false },
            stoppedAt: { type: Date, required: false },
        },
        company: {
            type: {
                _id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
                plan: {
                    name: { type: String, required: true },
                    expirationDate: { type: Date },
                    startDate: { type: Date, required: true },
                    periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
                },
                isOwner: { type: Boolean, required: true },
            },
            required: false,
        },
    },
    { timestamps: true },
);

export const UserBouncerModel = (c: Connection) =>
    c.model<IUserBouncer<PermissionName, PermissionGroupName, PlanName> & Document>('UserPermission', UserBouncerSchema);

/**
 * Metadata shiva
 */
const MetadataShivaSchema = new Schema({ user: { type: String, required: true }, firstLinkedInActionDate: { type: Date } }, { timestamps: true });

export const MetadataShivaModel = (c: Connection) => c.model<IMetadataShiva & Document>('Metadata', MetadataShivaSchema);

/**
 * Metadata hermes
 */
const MetadataHermesSchema = new Schema({ user: { type: String, required: true }, firstMailDate: { type: Date } }, { timestamps: true });

export const MetadataHermesModel = (c: Connection) => c.model<IMetadataHermes & Document>('Metadata', MetadataHermesSchema);

/**
 * Metadata goulag
 */
const MetadataGoulagSchema = new Schema(
    {
        user: String,
        firstProspectCreatedDate: {
            type: Date,
            required: false,
            default: undefined,
        },
    },
    { timestamps: true },
);

export const MetadataGoulagModel = (c: Connection) => c.model<IMetadataGoulag & Document>('Metadata', MetadataGoulagSchema);
