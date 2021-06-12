import dotEnv from 'dotenv';
import Mongoose, { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { Profile, Prospect } from './interfaces';
import { ProfileModel, ProspectModel } from './schemas';

dotEnv.config();

const PAUSE_BETWEEN_BATCH = 1000;
const BATCH_SIZE = 1000;

//@ts-ignore
var dotize = dotize || {};

//@ts-ignore
dotize.parse = function (jsonobj, prefix) {
    //@ts-ignore
    var newobj = {};
    //@ts-ignore
    function recurse(o, p) {
        for (var f in o) {
            //@ts-ignore
            var pre = p === undefined ? '' : p + '.';
            //@ts-ignore
            if (o[f] && typeof o[f] === 'object') {
                //@ts-ignore
                newobj = recurse(o[f], pre + f);
                //@ts-ignore
            } else {
                //@ts-ignore
                newobj[pre + f] = o[f];
            }
        }
        //@ts-ignore
        return newobj;
    }
    return recurse(jsonobj, prefix);
};

const getProfiles = (c: Connection, start: number) => ProfileModel(c).find({}).skip(start).limit(BATCH_SIZE).lean().exec();

const createOrConditions = (profileData: Profile): { $or: {}[] } => ({
    $or: [
        ...(profileData.memberId !== undefined ? [{ 'profile.memberId': profileData.memberId }] : []),
        ...(profileData.publicIdentifier !== undefined ? [{ 'profile.publicIdentifier': profileData.publicIdentifier }] : []),
        ...(profileData.salesMemberId !== undefined ? [{ 'profile.salesMemberId': profileData.salesMemberId }] : []),
    ],
});

const findProspectsWithCorrespondingEmbededProfile = async (c: Connection, profile: Profile): Promise<Array<Prospect<Profile>>> => {
    return ProspectModel(c)
        .find({
            'profile._id': { $exists: true },
            ...createOrConditions(profile),
        })
        .exec();
};

const updateProspectsProfileWithNewId = async (
    c: Connection,
    prospectIds: Array<Mongoose.Types.ObjectId>,
    newId: Mongoose.Types.ObjectId,
    profileData: Omit<Profile, '_id'>,
): Promise<Array<Prospect>> => {
    await ProspectModel(c)
        .updateMany(
            { _id: { $in: prospectIds } },
            {
                $set: {
                    //@ts-ignore
                    profile: { _id: newId, ...profileData },
                },
            },
        )
        .exec();

    return ProspectModel(c)
        .find({ _id: { $in: prospectIds } })
        .exec();
};

export const fixMismatchProfileId = async () => {
    console.log('Starting fixMismatchProfileId');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const profilesCount = await ProfileModel(goulagDatabase).countDocuments();
    console.log(`Found ${profilesCount} Profiles`);
    let processedProfiles = 0;
    let nbMissmatch = 0;

    while (processedProfiles < profilesCount) {
        const profilesBatch = await getProfiles(goulagDatabase, processedProfiles);

        const results = await Promise.all<boolean | 'no_prospects'>(
            profilesBatch.map(async ({ _id: profileId, ...profile }) => {
                const prospects = await findProspectsWithCorrespondingEmbededProfile(goulagDatabase, { _id: profileId, ...profile });

                if (prospects.length === 0) return 'no_prospects';

                prospects.forEach((p) => {
                    if (p.profile._id.toString() !== profileId.toString()) nbMissmatch += 1;
                });

                const updatedProspects = await updateProspectsProfileWithNewId(
                    goulagDatabase,
                    prospects.map((prospect) => Mongoose.Types.ObjectId.createFromHexString(prospect._id.toString())),
                    profileId,
                    profile,
                );

                if (updatedProspects.length !== prospects.length) return false;

                updatedProspects.forEach((p) => {
                    if (p.profile._id.toString() !== profileId.toString()) {
                        throw new Error('update failing');
                    }
                });

                return true;
            }),
        );

        processedProfiles += BATCH_SIZE;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        console.log(`${results.filter((r) => !r).length} errors`);
        console.log(`${results.filter((r) => r === 'no_prospects').length} profiles without prospects`);

        console.log('Summary:', nbMissmatch, 'missmatch');
        console.log(
            `Processed ${processedProfiles}/${profilesCount} profiles. (${Math.min(
                Math.round((processedProfiles / profilesCount) * 100 * 100) / 100,
                100,
            )}%)`,
        );
    }

    console.log('exiting');

    process.exit(1);
};

fixMismatchProfileId();
