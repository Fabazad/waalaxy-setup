import { loginToDatabase } from '../../../mongoose';
import { Document, Schema } from 'mongoose';


const setDateFirstProspect = async (Metadata : any, Prospect : any) => {
    const users = await Metadata.find({});
    const date = new Date().toISOString();
    // @ts-ignore
    await Promise.all(
        users.map(async (user: { user: { toString: () => any; }; }) => {
            const prospectFounded = await Prospect.findOne({
                user: user.user
            });
            if (prospectFounded) {
                await Metadata.updateOne({
                        user: user.user.toString(),
                    },
                    {
                        firstProspectCreatedDate: date,
                    },
                );
            }
        }),
    );
};

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


const MetadataSchema = new Schema(
    {
        user: String,
        latestRecordedConnectionTime: Number,
        firstProspectCreatedDate: {
            type: Date,
            required: false,
            default: undefined,
        },
    },
    { timestamps: true },
);

const BirthdaySchema = new Schema({
    month: Number,
    day: Number,
});
 const phoneNumberSchema = new Schema({
    type: { type: Schema.Types.String },
    number: String,
});


const CustomProfileSchema = new Schema({
    firstName: { type: Schema.Types.String },
    lastName: { type: Schema.Types.String },
    occupation: { type: Schema.Types.String },
    company: { type: { name: String, linkedinUrl: String, website: String } },
    email: { type: Schema.Types.String },
    phoneNumbers: [phoneNumberSchema],
    region: { type: Schema.Types.String },
    birthday: BirthdaySchema,
});

const ProspectSchema = new Schema(
    {
        profile: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        customProfile: { type: CustomProfileSchema },
        prospectList: { type: Schema.Types.ObjectId, ref: 'ProspectList', required: true },
        user: { type: Schema.Types.ObjectId, required: true },
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        expiresAt: { type: Date, index: { expires: 0 } },
        oneToOneConversationId: { type: String },
        customData: { type: {}, default: {} },
        conversationIsMonitored: { type: Boolean, default: false },
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
            type: [{ type: Schema.Types.ObjectId, ref: 'Tag', required: false }],
            required: false,
            default: [],
        },
    },
    { timestamps: true },
);

export const setDateToUserWithProspect = async () => {
    console.log('Begin setDateToUserWithProspect');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const Metadata = goulagDatabase.model<any & Document>('Metadata', MetadataSchema);
    const Prospect = goulagDatabase.model<any & Document>('Prospect', ProspectSchema);
    await setDateFirstProspect(Metadata, Prospect)
    console.log('Done');
};