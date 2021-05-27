import { loginToDatabase } from '../../../mongoose';
import { Document, Schema } from 'mongoose';

const setDateFirstMail = async (Metadata: any, ActionHistory: any) => {
    const date = new Date().toISOString();
    const actionHistoriesUsers = await ActionHistory.distinct('user');
    // @ts-ignore
    await Promise.all(
        actionHistoriesUsers.map(async (actionHistoryUser: string) => {
            const metadataFounded = await Metadata.findOne({
                user: actionHistoryUser,
            });
            if (!metadataFounded) {
                await Metadata.create(
                    {
                        user: actionHistoryUser.toString(),
                    },
                    {
                        firstMailDate: date,
                    },
                );
            } else {
                await Metadata.updateOne(
                    {
                        user: actionHistoryUser.toString(),
                        firstMailDate: {
                            $exists: false,
                        },
                    },
                    {
                        firstMailDate: date,
                    },
                );
            }
        }),
    );
};

const MetadataSchema = new Schema(
    {
        user: String,
        firstMailDate: {
            type: Date,
            required: false,
            default: undefined,
        },
    },
    { timestamps: true },
);

const ActionHistorySchema = new Schema(
    {
        type: { type: String, required: true },
        user: { type: String, required: true },
        priority: { type: Number, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['success', 'fail'], required: true },
        wasMovedByUser: { type: Boolean },
        campaign: { type: String, required: true },
        executionDate: { type: Date },
        statusCode: { type: Number, required: false },
        failReason: { type: String, required: false },
    },
    { timestamps: true },
);

export const setDateFirstMailWithUsers = async () => {
    console.log('Begin setDateFirstLinkedInActionWithUsers');
    const hermesDatabase = await loginToDatabase(process.env.HERMES_DATABASE!);
    const Metadata = hermesDatabase.model<any & Document>('Metadata', MetadataSchema);
    const ActionHistory = hermesDatabase.model<any & Document>('ActionHistory', ActionHistorySchema);
    await setDateFirstMail(Metadata, ActionHistory);
    console.log('Done');
};
