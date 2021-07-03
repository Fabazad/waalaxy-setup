import OnuClient from '@waapi/onu';
import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const UserSchema = new mongoose.Schema(
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
        },
        waapiId: {
            type: String,
        },
        hasPaidBeta: { type: Boolean, required: false, default: false },
        hasBypass: { type: Boolean, required: false, default: false },
        freeTrial: {
            startDate: { type: Date },
            endDate: { type: Date },
        },
    },
    { timestamps: true },
);

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

const main = async () => {
    const onuClient = new OnuClient('waalaxy', `Bearer ${process.env.WAAPI_API_TOKEN}`);

    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const User = stargateDatabase.model<any & mongoose.Document>('User', UserSchema);

    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const UserPermission = bouncerDatabase.model<any & mongoose.Document>('UserPermission', UserPermissionSchema);

    const userPermissions = await UserPermission.find({});

    console.log(userPermissions.length);

    let i = 0;
    for (const userPermission of userPermissions) {
        console.log(`${i++}/${userPermissions.length}`);
        const user = await User.findOne({ _id: userPermission.user });
        if (!user) {
            console.log('User not found');
            continue;
        }
        await onuClient.updateMatchingData({
            waapiId: userPermission.waapiId,
            matchingAttributes: [
                {
                    name: 'memberId',
                    value: user.memberId,
                },
                {
                    name: 'linkedinId',
                    value: user.linkedinId,
                },
            ],
        });
    }
};

main();
