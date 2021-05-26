import { loginToDatabase } from '../../../mongoose';
import { getPlanByWorld } from './getPlanByWorld';
import * as mongoose from 'mongoose';


const scriptUpdateWorldTemplateWithTagPlan = async (WorldTemplate: any) => {
    const worlds = await WorldTemplate.find({});
    await Promise.all(
        worlds.map(async (world: any) => {
            const tag = getPlanByWorld(world)
            const worldTags = world.tags.filter((worldTag : string) => worldTag !== 'templates.tags.business' && worldTag !== 'templates.tags.advanced' && worldTag !== 'templates.tags.pro');
            await WorldTemplate.updateOne(
                {
                    _id: world._id,
                },
                {
                    tags: [...worldTags, tag],
                },
            );
        }),
    );
};

const WorldTemplateSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        shortDescription: { type: String, required: true },
        image: { type: String, required: true },
        complexity: { type: Number, required: true },
        relatedTemplates: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'WorldTemplate',
                    required: true,
                },
            ],
            required: true,
        },
        badges: {
            type: [
                {
                    name: { type: String, required: true },
                },
            ],
            required: true,
        },
        tags: { type: [{ type: String, required: true }], required: true },
        startingPoint: {
            id: { type: String, required: true },
            type: { type: String, required: true },
            params: {},
        },
        waypoints: {
            type: [
                {
                    id: { type: String, required: true },
                    type: { type: String, required: true },
                    params: {},
                },
            ],
            required: true,
        },
        paths: {
            type: [
                {
                    id: { type: String, required: true },
                    to: { type: String, required: true },
                    from: { type: String, required: true },
                    condition: {},
                },
            ],
            required: true,
        },
    },
    { timestamps: true },
);

export const updateWorldTemplateWithTagPlan = async () => {
    console.log('Begin updateWorldTemplateWithTagPlan');
    const profesorDatabase = await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const WorldTemplate = profesorDatabase.model<any & mongoose.Document>('WorldTemplate', WorldTemplateSchema);
    await scriptUpdateWorldTemplateWithTagPlan(WorldTemplate)
    console.log('Done');
};
