import mongoose, { Schema } from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const DropContactEnrichment = new Schema({
    enrichmentDate: Date,
    civility: String,
    first_name: String,
    last_name: String,
    full_name: String,
    email: { type: [{ email: String, qualification: String }] },
    phone: String,
    mobile_phone: String,
    company: String,
    website: String,
    linkedin: String,
    company_infogreffe: String,
    siren: String,
    siret: String,
    vat: String,
    nb_employees: String,
    naf5_code: String,
    naf5_des: String,
    siret_address: String,
    siret_zip: String,
    siret_city: String,
    company_linkedin: String,
    company_turnover: String,
    company_results: String,
});

const BirthdaySchema = new Schema({
    month: Number,
    day: Number,
});

const phoneNumberSchema = new Schema({
    type: { type: Schema.Types.String },
    number: String,
});

const ProfileSchema = new Schema(
    {
        publicIdentifier: String,
        memberId: String,
        salesMemberId: String,
        linkedinId: Number,
        firstName: String,
        lastName: String,
        occupation: String,
        profilePicture: String,
        influencer: { type: Boolean, default: false },
        jobSeeker: { type: Boolean, default: false },
        openLink: { type: Boolean, default: false },
        premium: { type: Boolean, default: false },
        profileUrl: String,
        region: String,
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        company: { type: { name: String, linkedinUrl: String, website: String } },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        birthday: BirthdaySchema,
        address: String,
        connectedAt: Date,
        email: String,
        phoneNumbers: [phoneNumberSchema],
        dropContactEnrichment: DropContactEnrichment,
    },
    { timestamps: true },
);

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
        profile: { type: ProfileSchema, required: true },
        customProfile: { type: CustomProfileSchema },
        prospectList: { type: Schema.Types.ObjectId, ref: 'ProspectList', required: true },
        user: { type: Schema.Types.ObjectId, required: true },
        distance: { type: String, enum: ['DISTANCE_1', 'DISTANCE_2', 'DISTANCE_3', 'OUT_OF_NETWORK'] },
        status: { type: String, enum: ['connected', 'pending', 'not_connected'] },
        expiresAt: { type: Date, index: { expires: 0 } },
        customData: { type: {}, default: {} },
        oneToOneConversationId: { type: String },
        isRepliedMonitored: { type: Boolean, default: false },
        isSeenMonitored: { type: Boolean, default: false },
        history: {
            type: [
                {
                    action: { type: String },
                    executionDate: { type: Date, required: true },
                    name: {
                        type: String,
                        required: true,
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

export const removeDuplicateHistoryItems = async () => {
    console.log('Starting removeDuplicateHistoryItems');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const Prospect = goulagDatabase.model<any & mongoose.Document>('Prospect', ProspectSchema);

    const BATCH_SIZE = 500;

    const toProcess = await Prospect.count({
        $or: [
            {
                'history.name': 'message_seen',
            },
            {
                'history.name': 'message_replied',
            },
            {
                'history.name': 'relationship_connection',
            },
        ],
    });

    console.log(`${toProcess} prospects to update`);

    let processed = 0;

    while (processed < toProcess) {
        const prospects = await Prospect.find(
            {
                $or: [
                    {
                        'history.name': 'message_seen',
                    },
                    {
                        'history.name': 'message_replied',
                    },
                    {
                        'history.name': 'relationship_connection',
                    },
                ],
            },
            { history: true },
        )
            .lean()
            .skip(processed)
            .limit(BATCH_SIZE);

        const sanityzedProspects = prospects.map((prospect) => {
            let hasMessageSeen = false;
            let hasMessageReplied = false;
            let hasAcceptedConnection = false;
            const sanityzedHistory = prospect.history.filter((element: any) => {
                if (element.name === 'message_replied' && hasMessageReplied) return false;
                if (element.name === 'message_seen' && hasMessageSeen) return false;
                if (element.name === 'relationship_connection' && hasAcceptedConnection) return false;

                if (element.name === 'linkedin_message') {
                    hasMessageReplied = false;
                    hasMessageSeen = false;
                }
                if (element.name === 'relationship_connection') hasAcceptedConnection = true;
                if (element.name === 'message_replied') hasMessageReplied = true;
                if (element.name === 'message_seen') hasMessageSeen = true;

                return true;
            });
            return { ...prospect, history: sanityzedHistory };
        });
        const {
            result: { nModified },
        } = await Prospect.bulkWrite(
            sanityzedProspects.map((prospect: any) => ({
                updateOne: {
                    filter: { _id: prospect._id },
                    update: { $set: { history: prospect.history } },
                },
            })),
        );
        console.log(nModified, '/', prospects.length, 'updated');
        if (nModified !== prospects.length) throw new Error('Failed to update all');
        processed += prospects.length;
        console.log(`${processed}/${toProcess} processed prospects (${Math.round((processed / toProcess) * 100 * 100) / 100}%)`);
    }
    console.log('Done');
    process.exit(1);
};

removeDuplicateHistoryItems();
