import dotEnv from 'dotenv';
import { loginToDatabase } from '../../../mongoose';
import { Connection, Types } from 'mongoose';
import { OldProspectModel, ProspectModel, TagModel } from './schemas';
import { Tag } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 20;
const PAUSE_BETWEEN_BATCH = 100;

const countTags = (c: Connection) =>
    TagModel(c)
        .countDocuments({})
        .exec();

const findTagBatch = (c: Connection, skip: number): Promise<Array<Tag>> =>
    TagModel(c)
        .find()
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean()
        .exec();

const denormalizeTags = async () => {
    console.log('Starting denormalizeTags');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const totalTagsCount = await countTags(goulagDatabase);
    console.log(`Found ${totalTagsCount} Tags`);

    let processedTags = 0;

    while (processedTags < totalTagsCount) {
        const tags = await findTagBatch(goulagDatabase, processedTags);
        const tagIds = tags.map(t => t._id.toString());
        const prospectsToPopulate = await OldProspectModel(goulagDatabase).find({ tags: { $elemMatch: { $in: tagIds }}}).lean().exec()
        console.log("affected prospects", prospectsToPopulate.length)

        await ProspectModel(goulagDatabase).bulkWrite(
            prospectsToPopulate.map((prospect) => {
                const prospectTags = (prospect.tags || []).reduce<Array<Tag>>((res, prospectTagId) => {
                    if (!Types.ObjectId.isValid(prospectTagId.toString())) return res;
                    const prospectTag = tags.find((t) => t._id.toString() === prospectTagId.toString());
                    if (prospectTag === undefined) return res;
                    return [...res, prospectTag];
                }, []);

                return {
                    updateOne: {
                        filter: { _id: prospect._id },
                        update: {
                            $set: { tags: prospectTags },
                        },
                    },
                };
            }),
        );

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        processedTags = Math.min(processedTags + BATCH_SIZE, totalTagsCount);

        console.log(
            `${processedTags}/${totalTagsCount} processed tags (${
                Math.round((processedTags / totalTagsCount) * 100 * 100) / 100
            }%)`,
        );
    }

    console.log('exiting');
    await goulagDatabase.close();

    process.exit(1);
};

denormalizeTags();
