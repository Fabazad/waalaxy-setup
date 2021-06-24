import { Connection, Document, Schema } from 'mongoose';
import { IUser } from './interfaces';

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
        origin: { type: String, required: false },
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
        hasExtensionInstalled: { type: Boolean, required: false, default: false },
        dateExtensionUninstall: { type: Date, required: false },
    },
    { timestamps: true },
);

export const UserModel = (c: Connection) => c.model<IUser & Document>('User', UserSchema);
