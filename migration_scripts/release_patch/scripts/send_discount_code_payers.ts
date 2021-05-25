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
        hasPaid: { type: Boolean, required: false, default: false },
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

const onuClient = new OnuClient('waalaxy', `Bearer ${process.env.WAAPI_API_TOKEN}`);

export const sendDiscountCodeToPayers = async (isLive: boolean) => {
    if (isLive) {
        const timer = 20;
        console.log(`Script is in live mode, it will really send mails to users, waiting ${timer} seconds before starting, CTRL+C to cancel`);
        await new Promise((r) => setTimeout(r, timer * 1000));
    } else {
        console.log(`Test mode, no mails will be sent`);
    }

    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const User = stargateDatabase.model<any & mongoose.Document>('User', UserSchema);

    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const UserPermission = bouncerDatabase.model<any & mongoose.Document>('UserPermission', UserPermissionSchema);

    const users: Array<{ _id: string; email: string; firstName: string; lastName: string; language: string }> = await User.find(
        { hasPaid: true, isStaff: { $ne: true } },
        { email: 1, firstName: 1, lastName: 1, language: 1 },
    );

    console.log(`Found ${users.length} users`);
    const userPermissions = await UserPermission.find({ user: { $in: users.map((u) => u._id) } });
    console.log(`Found ${userPermissions.length} users permissions`);

    if (userPermissions.length !== users.length) throw new Error('Wrong count');

    const results = await Promise.all(
        userPermissions.map(async (userPermission) => {
            const user = users.find((u) => u._id.toString() === userPermission.user.toString());
            if (!user) throw new Error('User not found');
            const params = [
                [
                    {
                        id: 'myid',
                        language: 'en',
                        senderMail: 'waalaxy@gmail.com',
                        senderName: 'Waalaxy',
                    },
                    {
                        id: 'myid',
                        language: 'fr',
                        senderMail: 'waalaxy@gmail.com',
                        senderName: 'Waalaxy',
                    },
                ],
                1,
                userPermission.waapiId,
                'beta_access_paid_discount',
                {
                    discountCode: 'zfozeg',
                    _id: userPermission.waapiId,
                    id: userPermission.waapiId,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                },
                false,
                'transactional',
            ];
            // @ts-ignore
            if (isLive) return onuClient.sendMail(...params);
            return params;
        }),
    );
    console.log(results);
    console.log('Done');
};
