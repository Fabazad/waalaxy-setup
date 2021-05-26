import { loginToDatabase } from '../../../mongoose';
import { getPlanByWorld } from './getPlanByWorld';
import mongoose from 'mongoose';


const scriptUpdateWorldWithTagPlan = async (World: any) => {
    const worlds = await World.find({});
    await Promise.all(
        worlds.map(async (world: any) => {
            const tag = getPlanByWorld(world);
            const worldTags = world.tags.filter((worldTag : any) => worldTag !== 'templates.tags.business' && worldTag !== 'templates.tags.advanced' && worldTag !== 'templates.tags.pro');
            await World.updateOne(
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

export const updateWorldWithTagPlan = async () => {
    console.log('Begin updateWorldWithTagPlan');
    const profesorDatabase =  await loginToDatabase(process.env.PROFESOR_DATABASE!);
    const World = profesorDatabase.model<any & mongoose.Document>('World', WorldSchema);
    await scriptUpdateWorldWithTagPlan(World)
    console.log('Done');
};
