import { Connection, Document, Schema } from 'mongoose';
import { IUserPermission, PermissionGroupName, PermissionName, PlanName } from './interfaces';

export const PlanSchema = new Schema(
    {
        name: { type: String, required: true },
        expirationDate: { type: Date },
        startDate: { type: Date, required: true },
        periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
    },
    { _id: false },
);

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
