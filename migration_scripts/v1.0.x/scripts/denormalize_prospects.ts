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

export const denormalizeProspects = async () => {
    console.log('Begin denormalizeProspects');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const Profile = goulagDatabase.model<any & mongoose.Document>('Profile', ProfileSchema);
    const Prospect = goulagDatabase.model<any & mongoose.Document>('Prospect', ProspectSchema);

    const count = await Prospect.count({ 'profile._id': { $exists: false } });
    console.log(`${count} prospects to process`);

    const batchSize = 1000;
    let skip = 0;
    while (skip < count) {
        const prospects = await Prospect.find({ 'profile._id': { $exists: false } })
            .skip(skip)
            .limit(batchSize)
            .select({ profile: true })
            .lean();
        const toUpdate = prospects.filter((p) => !!p.profile);

        const profiles = await Profile.find({
            _id: { $in: toUpdate.map((p) => p.profile.toString()) },
        }).lean();

        await Prospect.bulkWrite(
            toUpdate.map((prospect) => ({
                updateOne: {
                    filter: { _id: prospect._id },
                    update: { profile: profiles.find((profile) => profile._id.toString() === prospect.profile.toString()) },
                },
            })),
        );

        console.log(`${skip}/${count}`);
        skip += batchSize;
    }

    console.log('Done');
};

denormalizeProspects();
