import { loginToDatabase } from '../../../mongoose';
import { getPlanByWorld } from './getPlanByWorld';
import * as mongoose from 'mongoose';
import { IDraftCampaign } from '../../../back/services/profesor/src/entities/DraftCampaign';


const scriptUpdateDraftCampaignWithTagPlan = async (DraftCampaign: any) => {
    const draftCampaigns = await DraftCampaign.find({});
    console.log(draftCampaigns)
    await Promise.all(
        draftCampaigns.map(async (draftCampaign: any) => {
            const tag = getPlanByWorld(draftCampaign.sequence)
            console.log(tag)
            const worldTags = draftCampaign.sequence?.tags?.filter((worldTag : string) => worldTag !== 'templates.tags.business' && worldTag !== 'templates.tags.advanced' && worldTag !== 'templates.tags.pro');
            await DraftCampaign.updateOne(
                {
                    _id: draftCampaign._id,
                },
                {
                   "sequence.tags": [...worldTags, tag] ,
                }
            );
        }),
    );
};

const WorldSubModel = new mongoose.Schema({
    paths: {
        type: [
            {
                id: { type: String },
                to: { type: String },
                from: { type: String },
                condition: {},
            },
        ],
        default: undefined,
    },
    startingPoint: {
        id: { type: String },
        type: { type: String },
        params: {},
    },
    waypoints: {
        type: [
            {
                id: { type: String },
                type: { type: String },
                params: {},
            },
        ],
        default: undefined,
    },
    complexity: {
        default: 0,
        type: Number,
    },
    tags: {
        type: [String],
    },
    frozen: {
        reason: String,
    },
});

const DraftCampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: String, required: true },
        state: { type: String, enum: ['draft'], required: true },
        subWorlds: {
            required: false,
            onReply: {
                world: WorldSubModel,
            },
        },
        sequence: { type: WorldSubModel, required: false },
        prospectSources: {
            type: [
                {
                    prospectList: {},
                    trigger: {},
                    filters: { type: [{}], default: undefined },
                    count: { type: Number },
                    inc: { type: [{ type: String }], default: undefined },
                    exc: { type: [{ type: String }], default: undefined },
                },
            ],
            required: false,
        },
        iconColor: { type: String },
    },
    { timestamps: true },
);

export const updatDraftCampaignWithTagPlan = async () => {
    console.log('Begin updatDraftCampaignWithTagPlan');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const DraftCampaign = profesorDatabase.model<IDraftCampaign & mongoose.Document>('DraftCampaign', DraftCampaignSchema);
    await scriptUpdateDraftCampaignWithTagPlan(DraftCampaign)
    console.log('Done');
};
