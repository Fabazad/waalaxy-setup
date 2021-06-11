import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import {EnrichmentModel, ProspectModel} from './schemas';
import dotEnv from 'dotenv';

dotEnv.config();

const BATCH_SIZE = 1000;

const getProspects = (c: Connection, start: number) => ProspectModel(c).find({}).skip(start).limit(BATCH_SIZE).lean().exec();

export const fixProspectHasBeenEnriched = async () => {
    console.log('Starting fixProspectHasBeenEnriched');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    const enutrofDatabase = await loginToDatabase(process.env.ENUTROF_DATABASE!);

    const isLive = !!process.argv[2];

    if (!isLive) {
        console.log("Add test data");
        const user = "60c355f09074310022eb2123";
        const prospectList = "60c355f09074310022eb2123";
        const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
        const prospect = await ProspectModel(goulagDatabase).create({
            profile: {
                _id: "60c355f09074310022eb2123",
                firstName: "firstname",
                lastName: "lastname"
            },
            prospectList,
            user
        })
        await EnrichmentModel(enutrofDatabase).create({
            prospect: prospect._id.toString(),
            user,
            status: "processed",
            requestId: "atygpbkbjyyowez",
            dataToEnrich: {},
            enrichementResult: {}
        })

        const prospect2 = await ProspectModel(goulagDatabase).create({
            profile: {
                _id: "60c355f09074310022eb2123",
                firstName: "firstname",
                lastName: "lastname"
            },
            prospectList,
            user,
            hasBeenEnriched: true
        })
        await EnrichmentModel(enutrofDatabase).create({
            prospect: prospect2._id.toString(),
            user,
            status: "processed",
            requestId: "atygpbkbjyyowez",
            dataToEnrich: {},
            enrichementResult: {}
        })
    }

    const prospectsCount = await ProspectModel(goulagDatabase).countDocuments();
    console.log(`Found ${prospectsCount} Prospects`);
    let processedProspects = 0;

    while (processedProspects < prospectsCount) {
        const prospectsBatch = await getProspects(goulagDatabase, processedProspects);

        const enrichments = await EnrichmentModel(enutrofDatabase).find({
            prospect: { $in: prospectsBatch.map((p) => p._id.toString()) },
            status: "processed"
        });

        // @ts-ignore
        const enrichedProspectIds = [...new Set(enrichments.map(e => e.prospect.toString()))];

        const bulks = enrichedProspectIds.reduce<Array<any>>((res, prospectId) => {
            const prospect = prospectsBatch.find(p => p._id.toString() === prospectId);

            if (prospect === undefined) {
                console.log("Could not find prospect " + prospectId);
                return res;
            }

            if (prospect.hasBeenEnriched === true) return res

            const bulk = {
                updateOne: {
                    filter: {_id: prospectId},
                    update: { hasBeenEnriched: true },
                }
            }

            return [...res, bulk]
        }, [])

        await ProspectModel(goulagDatabase).bulkWrite(bulks);

        processedProspects += BATCH_SIZE;

        console.log(`${bulks.length} enrichments`);

        console.log(
            `Processed ${processedProspects}/${prospectsCount} prospects. (${Math.min(
                Math.round((processedProspects / prospectsCount) * 100 * 100) / 100,
                100,
            )}%)`,
        );
    }

    console.log('exiting');

    process.exit(1);
};

fixProspectHasBeenEnriched();
