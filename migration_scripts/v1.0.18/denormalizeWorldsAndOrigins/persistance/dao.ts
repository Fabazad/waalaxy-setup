// eslint-disable-next-line import/no-extraneous-dependencies
import { BulkWriteOperation } from 'mongodb';
import { Connection, FilterQuery, Types } from 'mongoose';
import { SUBWORLD_TYPES } from './constants';
import { Campaign, OldCampaign, OldTraveler, Origin, Traveler, World } from './interfaces';
import { CampaignModel, OriginModel, TravelerModel, WorldModel } from './schemas';

const worldsConditions: FilterQuery<World> = {};
export const getWorlds = (c: Connection, start: number, batchSize: number): Promise<Array<World>> =>
    WorldModel(c).find(worldsConditions, { timeout: false }).skip(start).limit(batchSize).lean().exec();
export const countWorlds = (c: Connection): Promise<number> => WorldModel(c).count(worldsConditions).exec();

const originsConditions: FilterQuery<Origin> = {};
export const getOrigins = (c: Connection, start: number, batchSize: number): Promise<Array<Origin>> =>
    // @ts-ignore
    OriginModel(c).find(originsConditions, { timeout: false }).skip(start).limit(batchSize).lean().exec();
export const countOrigins = (c: Connection): Promise<number> => OriginModel(c).count(originsConditions).exec();

export type BulkUpdate<T> = Array<BulkWriteOperation<T>>;
export const bulkUpdateTravelers = (c: Connection, updates: BulkUpdate<Traveler | OldTraveler>) => TravelerModel(c).bulkWrite(updates);
export const bulkUpdateCampaigns = (c: Connection, updates: BulkUpdate<Campaign | OldCampaign>) => CampaignModel(c).bulkWrite(updates);

// TODO: create an index on travelers.world to prevent doing a collscan ?
export const buildTravelerWorldUpdate = (world: World): BulkUpdate<Traveler | OldTraveler>[number] => ({
    updateMany: {
        filter: {
            world: Types.ObjectId(world._id) as unknown as string,
        },
        update: {
            $set: { world },
        },
    },
});

// TODO: create an index on travelers.travelStates.world to prevent doing a collscan ?
export const buildTravelerTravelStatesWorldUpdate = (world: World): BulkUpdate<Traveler | OldTraveler>[number] => ({
    updateMany: {
        filter: {
            'travelStates.world': Types.ObjectId(world._id) as unknown as string,
        },
        update: {
            $set: { 'travelStates.$[elem].world': world },
        },
        arrayFilters: [{ 'elem.world': Types.ObjectId(world._id) as unknown as string }],
    },
});

// TODO: create an index on campaigns.world to prevent doing a collscan ?
export const buildCampaignWorldUpdate = (world: World): BulkUpdate<Campaign | OldCampaign>[number] => ({
    updateMany: {
        filter: {
            world: Types.ObjectId(world._id) as unknown as string,
        },
        update: {
            $set: { world },
        },
    },
});

// TODO: create an index on campaigns.subWorlds.onReply.world to prevent doing a collscan ?
export const buildCampaignSubWorldsUpdate = (world: World): BulkUpdate<Campaign | OldCampaign> =>
    SUBWORLD_TYPES.map<BulkUpdate<Campaign | OldCampaign>[number]>((subWorldType) => ({
        updateMany: {
            filter: {
                [`subWorlds.${subWorldType}.world`]: Types.ObjectId(world._id) as unknown as string,
            },
            update: {
                $set: { [`subWorlds.${subWorldType}.world`]: world },
            },
        },
    }));

// TODO: create an index on travelers.origin to prevent doing a collscan ?
export const buildTravelerOriginUpdate = (origin: Origin): BulkUpdate<Traveler | OldTraveler>[number] => ({
    updateMany: {
        filter: {
            origin: Types.ObjectId(origin._id) as unknown as string,
        },
        update: {
            $set: { origin },
        },
    },
});

// TODO: create an index on campaigns.origins to prevent doing a collscan ?
export const buildCampaignOriginsUpdate = (origin: Origin): BulkUpdate<Campaign | OldCampaign>[number] => ({
    updateMany: {
        filter: {
            origins: Types.ObjectId(origin._id) as unknown as string,
        },
        update: {
            $set: { 'origins.$': origin },
        },
    },
});

const isObjectId = () => ({ $type: 7 });

export const countNotUpdatedTravelers = (c: Connection): Promise<number> =>
    TravelerModel(c)
        .count({ $or: [{ origin: isObjectId() }, { world: isObjectId() }, { 'travelStates.world': isObjectId() }] })
        .exec();

export const countNotUpdatedCampaigns = (c: Connection): Promise<number> =>
    CampaignModel(c)
        .count({
            $or: [
                { origins: isObjectId() },
                { world: isObjectId() },
                ...SUBWORLD_TYPES.map((subWorldType) => ({ [`subWorlds.${subWorldType}.world'`]: isObjectId() })),
            ],
        })
        .exec();
