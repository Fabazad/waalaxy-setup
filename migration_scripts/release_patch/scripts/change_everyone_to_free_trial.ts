import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const UserPermissionSchema = new mongoose.Schema(
    {
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
            },
            excluded: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
            },
        },
        plan: {
            name: { type: String, required: true },
            expirationDate: { type: Date },
            startDate: { type: Date, required: true },
            periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
        },
    },
    { timestamps: true },
);

export const changeEveryoneToFreeTrial = async (isLive: boolean) => {
    console.log('Starting changeEveryoneToFreeTrial');
    if (!isLive) return console.log('Not in live mode');
    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const UserPermission = bouncerDatabase.model<any & mongoose.Document>('UserPermission', UserPermissionSchema);

    await UserPermission.updateMany(
        {
            'permissions.included.name': 'staff_role',
        },
        {
            $set: {
                'plan.name': 'business',
                'plan.periodicity': 'weekly',
                'plan.startDate': new Date().toISOString(),
                'plan.expirationDate': '2021-06-06T20:00:43.264Z',
                'permissions.included': [{ name: 'business_role' }, { name: 'staff_role' }],
            },
        },
    );

    await UserPermission.updateMany(
        {
            'permissions.included.name': { $nin: ['staff_role'] },
        },
        {
            $set: {
                'plan.name': 'business',
                'plan.periodicity': 'weekly',
                'plan.startDate': new Date().toISOString(),
                'plan.expirationDate': '2021-06-06T20:00:43.264Z',
                'permissions.included': [{ name: 'business_role' }],
            },
        },
    );

    console.log('Done');
};
