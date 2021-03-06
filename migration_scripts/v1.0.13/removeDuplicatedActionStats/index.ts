import dotEnv from 'dotenv';
import { Document, Model, Schema } from 'mongoose';
import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printStartScript } from '../../scriptHelper';
import { IUserKpi } from './interfaces';
import * as Schemas from './schemas';

dotEnv.config();

const BATCH_SIZE = 1000;

const findSameStats = <T extends Document>(
    model: Model<T>,
    filter: { emailId?: string; action?: Schema.Types.ObjectId; status: string; user: string },
) =>
    model.collection
        .find(filter)
        .project({
            _id: -1,
        })
        .toArray();

const findSameUserKPIs = <T extends Document>(model: Model<T>, filter: { user: string }) => model.collection.find(filter).toArray();

const findStats = <T extends Document>(model: Model<T>) => model.collection.find({}).batchSize(BATCH_SIZE).sort({ user: -1 }).stream();

const deleteDuplicatedActionsById = (model: Model<any>, toDelete: Schema.Types.ObjectId[]) =>
    model
        .deleteMany({
            _id: {
                $in: toDelete,
            },
        })
        .exec();

const insertNewUserKPI = (model: Schemas.UserKpiModel, doc: IUserKpi) => model.create(doc);

const countCollectionDocuments = <T extends Document>(model: Model<T>): Promise<number> => model.count({}).exec();

const handleStat = async (model: ReturnType<typeof Schemas[keyof typeof Schemas]>) => {
    let processedCount = 0;
    let totalDeletedCount = 0;

    const currentModel = model as Model<Document>;

    const count = await countCollectionDocuments(currentModel);
    console.log(`Found ${count} ${currentModel.modelName} Documents`);

    const processedDuplicates: Schema.Types.ObjectId[] = [];

    if (currentModel.modelName === 'UserKpi') {
        for await (const document of findStats(currentModel as Schemas.UserKpiModel)) {
            processedCount += 1;
            if (processedDuplicates.find((d) => d.toString() === document.user.toString())) {
                continue;
            }

            processedDuplicates.push(document.user);

            const duplicated = await findSameUserKPIs(currentModel as Schemas.UserKpiModel, {
                user: document.user,
            });

            if (duplicated.length > 1) {
                const toInsert = duplicated.reduce(
                    (newDoc, dup) => ({
                        ...newDoc,
                        ...dup,
                    }),
                    {},
                );
                delete toInsert._id;
                processedCount += duplicated.length - 1;
                const { deletedCount = 0 } = await deleteDuplicatedActionsById(
                    currentModel,
                    duplicated.map((d) => d._id),
                );

                await insertNewUserKPI(currentModel as Schemas.UserKpiModel, toInsert);

                totalDeletedCount += deletedCount;
                console.log(`${currentModel.modelName}: ${processedCount}/${count} (${(((processedCount / count) * 100 * 100) / 100).toFixed(2)}%)`);
            }
        }
    } else {
        const duplicatesToProcess: Schema.Types.ObjectId[] = [];

        for await (const document of findStats(currentModel)) {
            processedCount += 1;
            if (
                processedDuplicates.find((d) => d.toString() === document._id.toString()) ||
                duplicatesToProcess.find((d) => d.toString() === document._id.toString())
            ) {
                continue;
            }

            processedDuplicates.push(document._id);

            const duplicatedEmailId = document.emailId
                ? await findSameStats(currentModel, {
                      status: document.status,
                      user: document.user,
                      emailId: document.emailId,
                  })
                : [];

            if (duplicatedEmailId.length > 1) {
                duplicatesToProcess.push(
                    ...duplicatedEmailId.reduce<Schema.Types.ObjectId[]>((acc, val) => {
                        if (
                            val._id.toString() !== document._id.toString() &&
                            !duplicatesToProcess.find((d) => d.toString() === document._id.toString())
                        ) {
                            acc.push(val._id);
                        }
                        return acc;
                    }, []),
                );
                processedCount += duplicatedEmailId.length - 1;
            }

            const duplicatedAction = document.action
                ? await findSameStats(currentModel, {
                      status: document.status,
                      user: document.user,
                      action: document.action,
                  })
                : [];

            if (duplicatedAction.length > 1) {
                duplicatesToProcess.push(
                    ...duplicatedAction.reduce<Schema.Types.ObjectId[]>((acc, val) => {
                        if (
                            val._id.toString() !== document._id.toString() &&
                            !duplicatesToProcess.find((d) => d.toString() === document._id.toString())
                        ) {
                            acc.push(val._id);
                        }
                        return acc;
                    }, []),
                );
                processedCount += duplicatedAction.length - 1;
            }

            if (duplicatesToProcess.length > 1000) {
                processedDuplicates.push(...duplicatesToProcess);
                const { deletedCount = 0 } = await deleteDuplicatedActionsById(currentModel, duplicatesToProcess.splice(0, 1000));
                totalDeletedCount += deletedCount;
                console.log(`${currentModel.modelName}: ${processedCount}/${count} (${(((processedCount / count) * 100 * 100) / 100).toFixed(2)}%)`);
            }
        }

        if (duplicatesToProcess.length) {
            processedDuplicates.push(...duplicatesToProcess);
            const { deletedCount = 0 } = await deleteDuplicatedActionsById(currentModel, duplicatesToProcess.splice(0));
            totalDeletedCount += deletedCount;
        }
    }

    return {
        modelName: currentModel.modelName,
        processedCount,
        totalDeletedCount,
    };
};

export const removeDuplicatedActionStats = async () => {
    printStartScript('Starting removeDuplicatedActionStats');
    const HawkingDatabase = await loginToDatabase(process.env.HAWKING_DATABASE!);

    await Promise.all(
        Object.keys(Schemas).map(async (key) => {
            const statModelKey = key as keyof typeof Schemas;
            return await handleStat(Schemas[statModelKey](HawkingDatabase));
        }),
    ).then((statsArr) => {
        statsArr.forEach(({ modelName, processedCount, totalDeletedCount }) => {
            console.log(`Recap ${modelName}: processed ${processedCount} and deleted ${totalDeletedCount}`);
        });
    });

    await disconnectFromDatabase();

    console.log('End');
};

removeDuplicatedActionStats();
