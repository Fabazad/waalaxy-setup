import dotEnv from 'dotenv';
import Mongoose, { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { Profile, Prospect } from './interfaces';
import { ProfileModel, ProspectModel } from './schemas';
import { mergeProfiles } from './utils';

dotEnv.config();

const PAUSE_BETWEEN_BATCH = 0;
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

const createOrConditions = (profileData: Profile, collection: 'profile' | 'prospect'): { $or: {}[] } => ({
    $or: [
        ...(profileData.memberId !== undefined ? [{ [collection === 'prospect' ? 'profile.memberId' : 'memberId']: profileData.memberId }] : []),
        ...(profileData.publicIdentifier !== undefined
            ? [{ [collection === 'prospect' ? 'profile.publicIdentifier' : 'publicIdentifier']: profileData.publicIdentifier }]
            : []),
        ...(profileData.salesMemberId !== undefined
            ? [{ [collection === 'prospect' ? 'profile.salesMemberId' : 'salesMemberId']: profileData.salesMemberId }]
            : []),
    ],
});

const findProspectsWithCorrespondingEmbededProfile = async (c: Connection, profile: Profile): Promise<Array<Prospect<Profile>>> => {
    return ProspectModel(c)
        .find({
            'profile._id': { $exists: true },
            ...createOrConditions(profile, 'prospect'),
        })
        .exec();
};

const updateProspectsProfileWithNewId = async (
    c: Connection,
    data: Array<{
        prospectIds: Array<Mongoose.Types.ObjectId>;
        newId: Mongoose.Types.ObjectId;
        profileData: Omit<Profile, '_id'>;
    }>,
): Promise<
    Array<{
        profileId: Mongoose.Types.ObjectId;
        prospectIds: Array<Mongoose.Types.ObjectId>;
        newProspects: Array<Prospect>;
        profileData: Omit<Profile, '_id'>;
    }>
> => {
    await ProspectModel(c).bulkWrite(
        data.map(({ prospectIds, newId, profileData }) => ({
            updateMany: {
                filter: { _id: { $in: prospectIds } },
                update: {
                    $set: {
                        //@ts-ignore
                        profile: { _id: newId, ...profileData },
                    },
                },
            },
        })),
    );

    return Promise.all(
        data.map(async (d) => ({
            profileId: d.newId,
            prospectIds: d.prospectIds,
            profileData: d.profileData,
            newProspects: await ProspectModel(c)
                .find({ _id: { $in: d.prospectIds } })
                .exec(),
        })),
    );
};

const handleProfilesDuplicates = async ({
    c,
    existingProfiles,
    profileData,
    profileId,
}: {
    c: Connection;
    existingProfiles: Array<Profile>;
    profileData: Omit<Profile, '_id'>;
    profileId: Mongoose.Types.ObjectId;
}) => {
    const mergedProfile = mergeProfiles([...existingProfiles, profileData]);
    if (!mergedProfile)
        throw new Error(`merge profiles failed for ${profileId.toString()} and ${existingProfiles.map((p) => p._id.toString()).join(',')}`);
    delete mergedProfile._id;
    const profile = await ProfileModel(c).create(mergedProfile);
    await Promise.all([
        ProspectModel(c).updateMany(
            {
                'profile._id': { $in: existingProfiles.map((p) => p._id.toString()) },
            },
            {
                $set: { profile },
            },
        ),
        ProfileModel(c).deleteMany({
            _id: { $in: existingProfiles.map((p) => p._id.toString()) },
        }),
    ]);
};

export const fixMismatchProfileId = async () => {
    console.log('Starting fixMismatchProfileId');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const profilesCount = await ProfileModel(goulagDatabase).countDocuments();
    console.log(`Found ${profilesCount} Profiles`);
    let processedProfiles = 0;
    let nbMissmatch = 0;
    const SKIP = 44000;

    while (processedProfiles < profilesCount - SKIP) {
        const profilesBatch = await getProfiles(goulagDatabase, processedProfiles + SKIP);

        const results = await Promise.all(
            profilesBatch.map(async ({ _id: profileId, ...profile }) => {
                const prospects = await findProspectsWithCorrespondingEmbededProfile(goulagDatabase, { _id: profileId, ...profile });

                if (prospects.length === 0) return 'no_prospects';

                prospects.forEach((p) => {
                    if (p.profile._id.toString() !== profileId.toString()) nbMissmatch += 1;
                });

                return { prospects, profileId, profile };
            }),
        );

        const noProspects = results.filter((r) => r === 'no_prospects');
        const success = results.filter((r) => r !== 'no_prospects') as Array<{
            prospects: Prospect<Profile>[];
            profileId: Mongoose.Types.ObjectId;
            profile: Profile;
        }>;

        const updateRes = await updateProspectsProfileWithNewId(
            goulagDatabase,
            success.map((r) => ({
                newId: r.profileId,
                profileData: r.profile,
                prospectIds: r.prospects.map((p) => Mongoose.Types.ObjectId.createFromHexString(p._id.toString())),
            })),
        );

        for await (const r of updateRes) {
            for await (const p of r.newProspects) {
                if (p.profile._id.toString() !== r.profileId.toString()) {
                    console.log(`update failing for prospect ${p._id.toString()} with profile ${r.profileId.toString()}`);
                    const existingProfiles = await ProfileModel(goulagDatabase)
                        .find(createOrConditions({ ...r.profileData, _id: r.profileId.toString() }, 'profile'))
                        .lean()
                        .exec();
                    if (existingProfiles.length <= 1)
                        console.log(`update failing for prospect ${p._id.toString()} with profile ${r.profileId.toString()}, no profile duplicate`);

                    await handleProfilesDuplicates({ c: goulagDatabase, profileData: r.profileData, profileId: r.profileId, existingProfiles });
                }
            }
        }

        processedProfiles += BATCH_SIZE;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        console.log(`${noProspects.length} profiles without prospects`);

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
