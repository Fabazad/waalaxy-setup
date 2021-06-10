import _ from 'lodash';
import Mongoose, { Connection, Schema } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { Profile, Prospect } from './interfaces';
import { ProfileModel, ProspectModel } from './schemas';
import dotEnv from 'dotenv';

dotEnv.config();

const PAUSE_BETWEEN_BATCH = 0;
const BATCH_SIZE = 1000;

const getProfiles = (c: Connection, start: number) => ProfileModel(c).find({}).skip(start).limit(BATCH_SIZE).lean().exec();

const createOrConditions = (profileData: Profile): { $or: {}[] } => ({
    $or: [
        ...(profileData.memberId !== undefined ? [{ 'profile.memberId': profileData.memberId }] : []),
        ...(profileData.publicIdentifier !== undefined ? [{ 'profile.publicIdentifier': profileData.publicIdentifier }] : []),
        ...(profileData.salesMemberId !== undefined ? [{ 'profile.salesMemberId': profileData.salesMemberId }] : []),
    ],
});

const findProspectWithCorrespondingEmbededProfile = async (c: Connection, profile: Profile): Promise<Prospect<Profile> | null> =>
    ProspectModel(c)
        .findOne({
            'profile._id': { $exists: true },
            ...createOrConditions(profile),
        })
        .exec();

const updateProspectProfileWithNewId = async (
    c: Connection,
    prospectId: Mongoose.Types.ObjectId,
    newId: Mongoose.Types.ObjectId,
): Promise<Prospect | null> => {
    return ProspectModel(c)
        .findOneAndUpdate(
            {
                _id: prospectId,
            },
            {
                $set: {
                    'profile._id': newId,
                },
            },
            {
                new: true,
            },
        )
        .exec();
};

export const fixMismatchProfileId = async () => {
    console.log('Starting fixMismatchProfileId');
    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);

    const profilesCount = await ProfileModel(goulagDatabase).countDocuments();
    console.log(`Found ${profilesCount} Profiles`);
    let processedProfiles = 0;

    while (processedProfiles < profilesCount) {
        const profilesBatch = await getProfiles(goulagDatabase, processedProfiles);

        const results = await Promise.all<boolean>(
            profilesBatch.map(async (profile) => {
                const prospect = await findProspectWithCorrespondingEmbededProfile(goulagDatabase, profile);

                if (!prospect) return false;

                if (prospect.profile._id.toString() === profile._id.toString()) {
                    return false;
                }

                const updatedProspect = await updateProspectProfileWithNewId(
                    goulagDatabase,
                    Mongoose.Types.ObjectId.createFromHexString(prospect._id.toString()),
                    profile._id,
                );

                if (!updatedProspect) return false;

                if (updatedProspect.profile._id.toString() !== profile._id.toString()) {
                    throw new Error('update failing');
                }

                return true;
            }),
        );

        processedProfiles += BATCH_SIZE;

        await new Promise((r) => {
            setTimeout(r, PAUSE_BETWEEN_BATCH);
        });

        console.log(`${results.filter((r) => r).length} mismatchs found`);

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
