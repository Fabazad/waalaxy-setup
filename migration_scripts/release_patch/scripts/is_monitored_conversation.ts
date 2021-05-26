import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const historyNamesRecord = {
    LINKEDIN_MESSAGE: 'linkedin_message',
    LINKEDIN_CONNECT: 'linkedin_connect',
    LINKEDIN_VISIT: 'linkedin_visit',
    LINKEDIN_FOLLOW: 'linkedin_follow',
    MESSAGE_SEEN: 'message_seen',
    MESSAGE_REPLIED: 'message_replied',
    LINKEDIN_CONNECTION: 'linkedin_connection',
    EMAIL_SENT: 'email_sent',
    EMAIL_REPLIED: 'email_replied',
    EMAIL_BOUNCED: 'email_bounced',
};

const BirthdaySchema = new mongoose.Schema({
    month: Number,
    day: Number,
});

const phoneNumberSchema = new mongoose.Schema({
    type: { type: mongoose.Schema.Types.String },
    number: String,
});

const CustomProfileSchema = new mongoose.Schema({
    firstName: { type: mongoose.Schema.Types.String },
    lastName: { type: mongoose.Schema.Types.String },
    occupation: { type: mongoose.Schema.Types.String },
    company: { type: { name: String, linkedinUrl: String, website: String } },
    email: { type: mongoose.Schema.Types.String },
    phoneNumbers: [phoneNumberSchema],
    region: { type: mongoose.Schema.Types.String },
    birthday: BirthdaySchema,
});

const ProspectSchema = new mongoose.Schema(
    {
        profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
        customProfile: { type: CustomProfileSchema },
        prospectList: { type: mongoose.Schema.Types.ObjectId, ref: 'ProspectList', required: true },
        user: { type: mongoose.Schema.Types.ObjectId, required: true },
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        expiresAt: { type: Date, index: { expires: 0 } },
        customData: { type: {}, default: {} },
        oneToOneConversationId: { type: String },
        isRepliedMonitored: { type: Boolean, default: false },
        isSeenMonitored: { type: Boolean, default: false },
        // This field is not in schema anymore, we want to remove it
        conversationIsMonitored: { type: Boolean, required: false },
        history: {
            type: [
                {
                    action: { type: String },
                    executionDate: { type: Date, required: true },
                    name: {
                        type: String,
                        required: true,
                        enum: Object.values(historyNamesRecord),
                    },
                    params: {
                        messageContent: { type: String },
                        messageId: { type: String },
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
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag', required: false }],
            required: false,
            default: [],
        },
    },
    { timestamps: true },
);

export const cleanProspectsConversationMonitored = async (isLive: boolean) => {
    if (!isLive) return console.log('Not in live mode closing');
    if (!!isLive) {
        const timer = 20;
        console.log(`Script is in live mode, it will really update database, waiting ${timer} seconds before starting, CTRL+C to cancel`);
        await new Promise((r) => setTimeout(r, timer * 1000));
    }

    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const Prospect = goulagDatabase.model<any & mongoose.Document>('Prospect', ProspectSchema);

    const res = await Prospect.updateMany(
        { conversationIsMonitored: true },
        { $set: { isRepliedMonitored: true, isSeenMonitored: true }, $unset: { conversationIsMonitored: 1 } },
    );
    console.log(res);
    console.log('Done');
};
