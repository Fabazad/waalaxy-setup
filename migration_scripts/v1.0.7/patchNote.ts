import OnuClient from '@waapi/onu';
import mongoose from 'mongoose';
import { loginToDatabase } from '../../mongoose';

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
    const ITEMS_PER_ITERATION = 1000;
    let mailSent = 0;
    let totalItems = 0;
    let hasMore = false;
    let lastId: string | undefined = undefined;
    console.time("Sending patch notes in");
    do {
        console.log(`Fetching ${ITEMS_PER_ITERATION} users (${totalItems}) - ${lastId}`);
        const userPermissions: any[] = await UserPermission.find(lastId ? {_id: {$lt: lastId}}: {}).sort({ _id: -1 }).limit(ITEMS_PER_ITERATION);
        console.log(`Retrieved ${userPermissions.length} users`);
        if (userPermissions.length) {
            totalItems += userPermissions.length;
            await Promise.all(userPermissions.map(async (userPermission) => {
                const user = await User.findOne({ _id: userPermission.user });
                if (!user) {
                    return;
                }
                if (!userPermission?.permissions?.included?.some((permissionInclude: any) => permissionInclude.name === "staff_role")) {
                    return;
                }
                const result = await onuClient.sendMail([{
                    language: "fr",
                    senderName: "Margot de Waalaxy",
                    senderMail: "contact@waalaxy.com",
                    id: "d-4a9d22eae4824580bff5e083d2582c72"
                }, {
                    language: "en",
                    senderName: "Margot from Waalaxy",
                    senderMail: "contact@waalaxy.com",
                    id: "d-b999dc84a5ed45fc8118560bf9ac3752"
                }], 1, {
                    waapiId: userPermission.waapiId,
                    email: undefined,
                    language: user.language,
                }, 'patch_notes_1.0.7', {
                    id: userPermission.waapiId,
                    email: user.emailContact || user.email
                }, false, 'update');
                if (result === "mail_sent") {
                    mailSent += 1;
                }
            }));
            lastId = userPermissions[userPermissions.length - 1]._id;
        }
        hasMore = userPermissions.length === ITEMS_PER_ITERATION;
    } while (hasMore);
    console.timeEnd("Sending patch notes in");
    console.log(`${mailSent} mail has been sent`);
}

main();