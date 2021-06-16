import { loginToDatabase } from '../../../../mongoose';
import {EnrichmentModel, ProspectModel} from './schemas';
import dotEnv from 'dotenv';

dotEnv.config();

const BATCH_SIZE = 1000;

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
        })
    }

    const enrichmentsCount = await EnrichmentModel(enutrofDatabase).countDocuments();
    console.log(`Found ${enrichmentsCount} Prospects`);
    let processedProspects = 0;

    while (processedProspects < enrichmentsCount) {
        const enrichments = await EnrichmentModel(enutrofDatabase).find({ status: "processed" }).skip(processedProspects).limit(BATCH_SIZE).lean().exec()

        // @ts-ignore
        const enrichedProspectIds = [...new Set(enrichments.map(e => e.prospect.toString()))];

        const bulks = enrichedProspectIds.reduce<Array<any>>((res, prospectId) => {
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

        console.log(
            `Processed ${processedProspects}/${enrichmentsCount} enrichments. (${Math.min(
                Math.round((processedProspects / enrichmentsCount) * 100 * 100) / 100,
                100,
            )}%)`,
        );
    }

    console.log('exiting');

    process.exit(1);
};

fixProspectHasBeenEnriched();
