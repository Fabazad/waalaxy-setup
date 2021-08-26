import { Connection, Document, Schema } from 'mongoose';
import { INewProspectList, IOldProspectList, IUser } from './interfaces';

const UserSchema = new Schema(
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
        email: { type: String, lowercase: true },
        emailContact: { type: String, lowercase: true },
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
        isPremiumSubscriber: { type: Boolean },
        origins: {
            type: [
                {
                    date: { type: Date, required: true },
                    content: { type: String, required: true },
                },
            ],
            required: true,
            _id: false,
        },
        waapiId: {
            type: String,
        },
        hasBypass: { type: Boolean, required: false, default: false },
        freeTrial: {
            startDate: { type: Date },
            endDate: { type: Date },
        },
        extensionState: {
            isInstalled: { type: Boolean, required: false, default: false },
            dateUninstall: { type: Date, required: false },
        },
    },
    { timestamps: true },
);

export const UserModel = (c: Connection) => c.model<IUser & Document>('User', UserSchema);

const OldProspectListSchema = new Schema(
    {
        user: Schema.Types.ObjectId,
        name: String,
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
);

export const OldProspectListModel = (c: Connection) =>
    c.model<IOldProspectList & Document>('OldProspectList', OldProspectListSchema, 'prospectlists');

const NewProspectListSchema = new Schema(
    {
        user: String,
        name: String,
        expiresAt: { type: Date, index: { expires: 0 } },
    },
    { timestamps: true },
);

export const NewProspectListModel = (c: Connection) =>
    c.model<INewProspectList & Document>('NewProspectList', NewProspectListSchema, 'prospectlists');
