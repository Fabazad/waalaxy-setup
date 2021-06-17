import dotEnv from 'dotenv';
import Mongoose, { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { OriginModel, ProspectModel, TravelerModel } from './schemas';
import { uniq } from 'lodash';
import { appendFile } from 'fs';
import { resolve, join } from 'path';
import { ITraveler, Prospect } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 10;
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
        .select('_id prospect origin')
        .limit(20);

const getProspects = (c: Connection, prospectIds: string[]) =>
    ProspectModel(c)
        .find({
            _id: {
                $in: prospectIds,
            },
        })
        .select({
            _id: true,
            prospectList: true,
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

const separateProspectWithIdFromProspectObject = (travelers: ITraveler[]): [string[], Prospect[]] =>
    travelers.reduce(
        ([prospectIds, prospectObjects], val) => {
            if (typeof val.prospect === 'string') {
                prospectIds.push(val.prospect);
            } else {
                prospectObjects.push(val.prospect);
            }

            return [prospectIds, prospectObjects];
        },
        [[], []] as [string[], Prospect[]],
    );

export const updateOriginWithProspectListId = async () => {
    console.log('Starting updateOriginWithProspectListId');
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

                const [prospectIds, prospectsObjects] = separateProspectWithIdFromProspectObject(travelersFromOrigin);

                const matchingProspects = await getProspects(goulagDatabase, prospectIds);

                if ([...matchingProspects, ...prospectsObjects].length === 0) {
                    console.log('Travelers without matching prospects');
                    return false;
                }

                const prospectListIds = uniq([
                    ...prospectsObjects.map((p) => p.prospectList.toString()),
                    ...matchingProspects.map((prospect) => prospect.prospectList.toString()),
                ]);

                if (prospectListIds.length !== 1) {
                    console.log('prospectListIds', prospectListIds);
                    console.log(` mismatching prospectList of matching prospects: ${prospectListIds.length}`);
                    await new Promise((r, rj) => {
                        appendFile(
                            resolve(join(__dirname, '/origin_mismatch.log')),
                            `-------------------${new Date().toUTCString()}-------------------\norigin: ${origin._id.toString()}\nprospectListIds: ${prospectListIds.toString()}\n`,
                            (err) => {
                                if (err) rj(err);
                                else r(true);
                            },
                        );
                    });
                    return false;
                } else {
                    await updateProspectBatchOriginWithoutProspectList(profesorDatabase, origin._id, prospectListIds[0]);

                    return true;
                }
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
