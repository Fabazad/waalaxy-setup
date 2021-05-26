import mongoose, { Schema } from 'mongoose';
import { BASE_CAMPAIGN_PRIORITY } from '../../../back/services/profesor/src/config';
import { loginToDatabase } from '../../../mongoose';
import { getPlanByWorld } from './getPlanByWorld';
const CAMPAIGN_STATES = ['paused', 'running', 'stopped'] as const;

const scriptUpdateCampaignWithTagPlan = async (Campaign : any, World:any) => {
    const campaigns = await Campaign.find({});

    await Promise.all(
        campaigns.map(async (campaign: { worldTags?: any; _id?: any; world?: any; }) => {
            const world = await World.findOne({_id: campaign.world})
            if(!world) return
            const tag = getPlanByWorld(world);
            const worldTags = (campaign?.worldTags? || []).filter((worldTag: string) =>
                worldTag !== 'templates.tags.business' && worldTag !== 'templates.tags.advanced' && worldTag !== 'templates.tags.pro'
            )
            await Campaign.updateOne(
                 {
                    _id: campaign._id,
                },
                {
                    worldTags: [...worldTags, tag],
                },
            );
        }),
    );
};


const waypoint = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: { type: String, required: true },
        params: {},
    },
    { _id: false },
);

const path = new mongoose.Schema(
    {
        id: { type: String, required: true },
        to: { type: String, required: true },
        from: { type: String, required: true },
        condition: {},
    },
    { _id: false },
);

const WorldSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        userId: { type: String, required: true },
        startingPoint: waypoint,
        waypoints: {
            type: [waypoint],
            required: true,
        },
        paths: {
            type: [path],
            required: true,
        },
        complexity: { type: Number, required: true },
        tags: { type: [String], required: true },
    },
    { timestamps: true },
);

const CampaignSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        user: { type: String, required: true },
        world: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'World',
            required: true,
        },
        priority: { type: Number, required: true, default: BASE_CAMPAIGN_PRIORITY },
        triggers: {
            type: [{ type: String, required: true }],
            required: true,
        },
        state: { type: String, enum: CAMPAIGN_STATES, required: true },
        origins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Origin', required: true }],
        iconColor: { type: String, required: false },
        subWorlds: {
            onReply: {
                world: {
                    type: Schema.Types.ObjectId,
                    ref: 'World',
                    required: false,
                },
            },
        },
        worldTags: {
            type: [String],
            required: true,
        },
        worldComplexity: {
            type: Number,
            required: true,
        },
        frozen: {
            reason: String,
        },
    },
    { timestamps: true },
);




export const updateCampaignWithTagPlan = async () => {
    console.log('Begin updateCampaignWithTagPlan');
    const campaignDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const Campaign = campaignDatabase.model<any & mongoose.Document>('Campaign', CampaignSchema);
    const World = campaignDatabase.model<any & mongoose.Document>('World', WorldSchema);
    await scriptUpdateCampaignWithTagPlan(Campaign, World)
    console.log('Done');
};