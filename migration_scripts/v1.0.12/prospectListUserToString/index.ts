import dotEnv from 'dotenv';
import { loginToDatabase } from '../../../mongoose';
import { Connection } from 'mongoose';
import { OldProspectListModel, NewProspectListModel } from './schemas';
import { IOldProspectList } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 5000;
const PAUSE_BETWEEN_BATCH = 500;

const countOldProspectList = (c: Connection) => OldProspectListModel(c).countDocuments({}).exec();

const getProspectListBatch = (c: Connection, skip: number): Promise<Array<IOldProspectList>> =>
    OldProspectListModel(c).find({}).skip(skip).limit(BATCH_SIZE).lean().exec();

const updateProspectListBatch = async (c: Connection, lists: Array<IOldProspectList>): Promise<number> => {
    const { modifiedCount } = await NewProspectListModel(c).bulkWrite(
        lists
            .filter(({ user }) => typeof user !== 'string')
            .map(({ _id, user }) => ({
                updateOne: {
                    filter: { _id },
                    update: {
                        $set: { user: user.toString() },
                    },
                },
            })),
    );

    return modifiedCount ?? 0;
};

const prospectListUserToString = async () => {
    console.log('Starting prospectListUserToString');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const prospectsListsCount = await countOldProspectList(goulagDatabase);
    console.log(`Found ${prospectsListsCount} Prospect Lists`);

    let processedProspectsLists = 0;
    let totalUpdatedCount = 0;

    while (processedProspectsLists < prospectsListsCount) {
        const updatedCount = await updateProspectListBatch(goulagDatabase, await getProspectListBatch(goulagDatabase, processedProspectsLists));

        processedProspectsLists = Math.min(processedProspectsLists + BATCH_SIZE, prospectsListsCount);

        totalUpdatedCount += updatedCount;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        console.log(`Updated: ${updatedCount} lists`);

        console.log(
            `${processedProspectsLists}/${prospectsListsCount} processed lists (${
                Math.round((processedProspectsLists / prospectsListsCount) * 100 * 100) / 100
            }%)`,
        );
    }

    console.log(`Updated total: ${totalUpdatedCount}`);

    console.log('exiting');
    await goulagDatabase.close();

    process.exit(1);
};

export { prospectListUserToString };

prospectListUserToString();
