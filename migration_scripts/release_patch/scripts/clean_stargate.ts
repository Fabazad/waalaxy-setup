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
        hasPaidBeta: { type: Boolean, required: false, default: false },
        hasBypass: { type: Boolean, required: false, default: false },
        freeTrial: {
            startDate: { type: Date },
            endDate: { type: Date },
        },
    },
    { timestamps: true },
);

export const cleanStargate = async (isLive: boolean) => {
    console.log('Starting clean_stargate');
    if (!isLive) return console.log('Not in live mode closing');
    if (!!isLive) {
        const timer = 20;
        console.log(`Script is in live mode, it will really update database, waiting ${timer} seconds before starting, CTRL+C to cancel`);
        await new Promise((r) => setTimeout(r, timer * 1000));
    }

    const stargateDatabase = await loginToDatabase(process.env.STARGATE_DATABASE!);
    const User = stargateDatabase.model<any & mongoose.Document>('User', UserSchema);

    await User.updateMany({ hasPaid: true }, { $set: { hasPaidBeta: true } });
    await User.updateMany({}, { $unset: { hasPaid: 1, isStaff: 1, hasBypass: 1 } });
    console.log('Done');
};
