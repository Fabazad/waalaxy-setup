import _ from 'lodash';
import { Schema } from 'mongoose';
import { Profile, Prospect } from './interfaces';
import { ProfileModel, ProspectModel } from './schemas';

const PAUSE_BETWEEN_BATCH = 5 * 1000;
const BATCH_SIZE = 100;

const getProfiles = (start: number) => ProfileModel.find({}).skip(start).limit(BATCH_SIZE).lean().exec();

const createOrConditions = (profileData: Profile): { $or: {}[] } => ({
    $or: [
        ...(profileData.memberId !== undefined ? [{ 'profile.memberId': profileData.memberId }] : []),
        ...(profileData.publicIdentifier !== undefined ? [{ 'profile.publicIdentifier': profileData.publicIdentifier }] : []),
        ...(profileData.salesMemberId !== undefined ? [{ 'profile.salesMemberId': profileData.salesMemberId }] : []),
    ],
});

const findProspectWithCorrespondingEmbededProfile = async (profile: Profile): Promise<Prospect<Profile> | null> =>
    ProspectModel.findOne({
        'profile._id': { $exists: true },
        ...createOrConditions(profile),
    });

const updateProspectProfileWithNewId = (prospectId: Schema.Types.ObjectId, newId: Schema.Types.ObjectId): Promise<Prospect | null> =>
    ProspectModel.updateOne(
        {
            _id: prospectId,
        },
        {
            $set: {
                'profile._id': newId,
            },
        },
    ).exec();

export const fixMismatchProfileId = async () => {
    console.log('Starting fixMismatchProfileId');

    const profilesCount = await ProfileModel.countDocuments();
    let processedProfiles = 0;

    while (processedProfiles < profilesCount) {
        const profilesBatch = await getProfiles(processedProfiles);

        const results = await Promise.all<boolean>(
            profilesBatch.map(async (profile) => {
                const prospect = await findProspectWithCorrespondingEmbededProfile(profile);

                if (prospect.profile._id.toString() === profile._id.toString()) {
                    return false;
                }

                if (!prospect) return false;

                const updatedProspect = await updateProspectProfileWithNewId(new Schema.Types.ObjectId(prospect._id.toString()), profile._id);

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
};
