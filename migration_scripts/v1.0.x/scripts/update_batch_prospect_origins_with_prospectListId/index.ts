import dotEnv from 'dotenv';
import Mongoose, { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { OriginModel, ProspectModel, TravelerModel } from './schemas';
import { uniq } from 'lodash';
dotEnv.config();

const BATCH_SIZE = 100;
const PAUSE_BETWEEN_BATCH = 0;

const countProspectBatchOriginWithoutProspectList = (c: Connection) =>
    OriginModel(c)
        .countDocuments({
            origin: 'prospect_batch',
            prospectList: {
                $exists: false,
            },
        })
        .exec();

const findProspectBatchOriginWithoutProspectList = (c: Connection, start: number) =>
    OriginModel(c)
        .find({
            origin: 'prospect_batch',
            prospectList: {
                $exists: false,
            },
        })
        .skip(start)
        .limit(BATCH_SIZE)
        .exec();

const getTravelersWithMatchingOrigin = (c: Connection, origin: Mongoose.Schema.Types.ObjectId) =>
    TravelerModel(c)
        .find({
            origin,
            prospect: {
                $exists: true,
            },
        })
        .select('prospect origin')
        .limit(20);

const getProspects = (c: Connection, prospectIds: string[]) =>
    ProspectModel(c).find({
        _id: {
            $in: prospectIds,
        },
    });

const updateProspectBatchOriginWithoutProspectList = async (c: Connection, originId: Schema.Types.ObjectId, prospectListId: string) =>
    OriginModel(c).updateOne(
        {
            _id: originId,
        },
        {
            prospectList: prospectListId,
        },
    );

export const updateOriginWithProspectListId = async () => {
    console.log('Starting fixMismatchProfileId');
    const [goulagDatabase, profesorDatabase] = await Promise.all([
        loginToDatabase(process.env.GOULAG_DATABASE!),
        loginToDatabase(process.env.PROFESOR_DATABASE!),
    ]);

    const originWithoutProspectListFieldCount = await countProspectBatchOriginWithoutProspectList(profesorDatabase);

    console.log(`Found ${originWithoutProspectListFieldCount} prospect_batch origins without prospectList field`);

    let processedOrigins = 0;
    let updatedOriginsCount = 0;

    while (processedOrigins < originWithoutProspectListFieldCount) {
        const originsBatch = await findProspectBatchOriginWithoutProspectList(profesorDatabase, processedOrigins);

        const results = await Promise.all(
            originsBatch.map(async (origin) => {
                const travelersFromOrigin = await getTravelersWithMatchingOrigin(profesorDatabase, origin._id);

                if (travelersFromOrigin.length === 0) {
                    console.log('Origin without travelers');
                    return false;
                }

                const matchingProspects = await getProspects(
                    goulagDatabase,
                    travelersFromOrigin.map((t) => t.prospect),
                );

                if (matchingProspects.length === 0) {
                    console.log('Travelers without matching prospects');
                    return false;
                }

                const prospectListIds = uniq(matchingProspects.map((prospect) => prospect.prospectList.toString()));

                if (prospectListIds.length !== 1) {
                    throw new Error(` mismatching prospectList of matching prospects: ${prospectListIds.length}`);
                }

                await updateProspectBatchOriginWithoutProspectList(profesorDatabase, origin._id, prospectListIds[0]);

                return true;
            }),
        );

        const updatedCount = results.filter((r) => r).length;
        console.log(`Updated ${updatedCount} origins`);

        updatedOriginsCount += updatedCount;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedOrigins =
            BATCH_SIZE + processedOrigins > originWithoutProspectListFieldCount ? originWithoutProspectListFieldCount : processedOrigins + BATCH_SIZE;

        console.log(
            `${processedOrigins}/${originWithoutProspectListFieldCount} processed origins (${
                Math.round((processedOrigins / originWithoutProspectListFieldCount) * 100 * 100) / 100
            }%)`,
        );
    }

    console.log(`${updatedOriginsCount} origins updated`);
    console.log('exiting');
    await Promise.all([goulagDatabase.close(), profesorDatabase.close()]);

    process.exit(1);
};

updateOriginWithProspectListId();
