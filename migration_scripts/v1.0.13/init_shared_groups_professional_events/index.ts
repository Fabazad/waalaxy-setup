import { loginToDatabase } from '../../../mongoose';
import { ProspectModel } from './schemas';

export const initSharedGroupsAndProfessionalEvents = async () => {
    console.log('initSharedGroupsAndProfessionalEvents');

    const goulagDatabase = await loginToDatabase(process.env.GOULAG_DATABASE!);
    await ProspectModel(goulagDatabase).updateMany({}, { $set: { sharedGroups: [], sharedProfessionalEvents: [] } });
};
