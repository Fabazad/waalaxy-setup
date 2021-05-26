import { loginToDatabase } from '../../../mongoose';
import mongoose, { Schema } from 'mongoose';


const scriptUpdateOccupationUndefined = async (Profile: any) => {
    await Profile.update({occupation: "undefined @ undefined"}, {occupation: undefined});
};

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

export const changeProfileOccupationUndefined = async () => {
    console.log('Begin changeProfileOccupationUndefined');
    const goulagDatabase =  await loginToDatabase(process.env.GOULAG_DATABASE!);
    const Profile = goulagDatabase.model<any & mongoose.Document>('Profile', ProfileSchema);
    await scriptUpdateOccupationUndefined(Profile)
    console.log('Done');
};
