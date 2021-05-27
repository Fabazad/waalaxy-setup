import { loginToDatabase } from '../../../mongoose';
import { Document, Schema } from 'mongoose';

const setDateFirstLinkedInAction = async (Metadata: any, ActionHistory: any) => {
    const date = new Date().toISOString();
    const actionHistoriesUsers = await ActionHistory.distinct('user');
    // @ts-ignore
    await Promise.all(
        actionHistoriesUsers.map(async (actionHistoryUser: string) => {
            await Metadata.updateOne(
                {
                    user: actionHistoryUser.toString(),
                    firstLinkedInActionDate: {
                        $exists: false,
                    },
                },
                {
                    firstLinkedInActionDate: date,
                },
                {
                    upsert: true,
                },
            );
        }),
    );
};

const MetadataSchema = new Schema(
    {
        user: String,
        firstLinkedInActionDate: {
            type: Date,
            required: false,
            default: undefined,
        },
    },
    { timestamps: true },
);
const ACTION_TYPES = {
    FOLLOW_LINKEDIN: 'followLinkedin',
    MESSAGE_LINKEDIN: 'messageLinkedin',
    VISIT_LINKEDIN: 'visitLinkedin',
    CONNECT_LINKEDIN: 'connectLinkedin',
} as const;
const actionTypes = Object.values(ACTION_TYPES);
const ActionHistorySchema = new Schema(
    {
        type: { type: String, enum: actionTypes, required: true },
        user: { type: String, required: true },
        priority: { type: Number, required: true },
        prospect: { type: String, required: true },
        status: { type: String, enum: ['success', 'fail'], required: true },
        wasMovedByUser: { type: Boolean },
        campaign: { type: String, required: true },
        executionDate: { type: Date },
        statusCode: { type: Number, required: false },
        failReason: { required: false },
    },
    { timestamps: true },
);

export const setDateFirstLinkedInActionWithUsers = async () => {
    console.log('Begin setDateFirstLinkedInActionWithUsers');
    const shivaDatabase = await loginToDatabase(process.env.SHIVA_DATABASE!);
    const Metadata = shivaDatabase.model<any & Document>('Metadata', MetadataSchema);
    const ActionHistory = shivaDatabase.model<any & Document>('ActionHistory', ActionHistorySchema);
    await setDateFirstLinkedInAction(Metadata, ActionHistory);
    console.log('Done');
};
