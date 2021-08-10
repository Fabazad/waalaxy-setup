import dotEnv from 'dotenv';
import { Connection, Schema, Types } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { printProgress } from '../../../scriptHelper';
import { ICorrectProspectList, IInvalidProspectList } from './interfaces';
import { CorrectProspectListModel, InvalidProspectListModel } from './schemas';
dotEnv.config();

const BATCH_SIZE = 1000;
const PAUSE_BETWEEN_BATCH = 0;

const countProspectLists = (c: Connection): Promise<number> => InvalidProspectListModel(c).countDocuments({}).exec();

const getPotentiallyInvalidProspectListBatch = (c: Connection, start: number): Promise<(IInvalidProspectList | ICorrectProspectList)[]> =>
    InvalidProspectListModel(c)
        .find()
        .skip(start)
        .limit(BATCH_SIZE)
        .sort({ _id: -1 })
        .select({
            _id: 1,
            status: 1,
            currentStop: 1,
            world: 1,
        })
        .lean()
        .exec();

const bulkUpdateProspectLists = (
    c: Connection,
    updates: {
        prospectListId: Schema.Types.ObjectId;
        userId: Types.ObjectId;
    }[],
) => {
    // console.log(updates);
    return CorrectProspectListModel(c).bulkWrite(
        updates.map(({ prospectListId, userId }) => ({
            updateOne: {
                filter: {
                    _id: prospectListId,
                },
                update: {
                    $set: {
                        user: userId,
                    },
                },
            },
        })),
        {
            ordered: false,
        },
    );
};
const isInvalidProspectList = (prospectList: ICorrectProspectList | IInvalidProspectList): prospectList is IInvalidProspectList =>
    typeof prospectList.user === 'string';

export const updateGoulagStringReferencesToObjectId = async () => {
    console.log('Running updateGoulagStringReferencesToObjectId');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const now = Date.now();

    const prospectListsToCheck = await countProspectLists(goulagDatabase);

    console.log(`Found: ${prospectListsToCheck} to update`);

    let processedProspectLists = 0;
    let updatedProspectLists = 0;

    // await getAllTravelersIdsToUpdate(goulagDatabase);
    while (processedProspectLists < prospectListsToCheck) {
        const prospectListBatch = await getPotentiallyInvalidProspectListBatch(goulagDatabase, processedProspectLists);
        const result = await bulkUpdateProspectLists(
            goulagDatabase,
            prospectListBatch.filter(isInvalidProspectList).map(({ _id, user }) => ({
                prospectListId: _id,
                // @ts-ignore
                userId: Types.ObjectId.createFromHexString(user),
            })),
        );

        console.log(result);

        updatedProspectLists += result.modifiedCount ?? 0;

        console.log(`\nUpdated ${result.modifiedCount} travelers`);

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedProspectLists =
            BATCH_SIZE + processedProspectLists > prospectListsToCheck ? prospectListsToCheck : processedProspectLists + BATCH_SIZE;

        printProgress(processedProspectLists, prospectListsToCheck, now);
        console.log('updated', updatedProspectLists);
    }

    console.log('Done !');

    process.exit();
};

updateGoulagStringReferencesToObjectId();
