import dotEnv from 'dotenv';
import { loginToDatabase } from '../../../mongoose';
import { Connection, Types } from 'mongoose';
import { ProspectModel, TagModel } from './schemas';
import { Prospect, Tag } from './interfaces';
dotEnv.config();

const BATCH_SIZE = 5000;
const PAUSE_BETWEEN_BATCH = 500;

const countProspects = (c: Connection) =>
    ProspectModel(c)
        .countDocuments({ tags: { $exists: true } })
        .exec();

const findProspectBatch = (c: Connection, skip: number): Promise<Array<Prospect>> =>
    ProspectModel(c)
        .find({ tags: { $exists: true } }, 'tags _id')
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean()
        .exec();

const denormalizeTags = async () => {
    console.log('Starting denormalizeTags');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const totalProspectsCount = await countProspects(goulagDatabase);
    console.log(`Found ${totalProspectsCount} Prospects`);

    let processedProspects = 0;

    while (processedProspects < totalProspectsCount) {
        const prospects = await findProspectBatch(goulagDatabase, processedProspects);
        const prospectsToPopulate = prospects.filter((p) => p.tags !== undefined && p.tags.length > 0);

        const tagIds = prospectsToPopulate.reduce<Array<string>>((res, prospect) => {
            if (prospect.tags === undefined) return res;
            const unpopulatedTags = prospect.tags.filter((tag) => Types.ObjectId.isValid(tag.toString())).map((t) => t.toString());
            return [...res, ...unpopulatedTags];
        }, []);

        const tags = await TagModel(goulagDatabase)
            .find({ _id: { $in: tagIds } })
            .lean()
            .exec();

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

        processedProspects = Math.min(processedProspects + BATCH_SIZE, totalProspectsCount);

        console.log(
            `${processedProspects}/${totalProspectsCount} processed users (${
                Math.round((processedProspects / totalProspectsCount) * 100 * 100) / 100
            }%)`,
        );
    }

    console.log('exiting');
    await goulagDatabase.close();

    process.exit(1);
};

denormalizeTags();
