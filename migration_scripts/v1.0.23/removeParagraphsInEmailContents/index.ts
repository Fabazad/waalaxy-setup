import { disconnectFromDatabase, loginToDatabase } from '../../../mongoose';
import { printProgress, printStartScript } from '../../scriptHelper';
import { EMAIL_CONTENTS_BATCH_SIZE } from './constants';
import { buildEmailContentUpdate, bulkUpdateContents, countEmailContents, getEmailContentsBatch } from './dao';
import { isMailContent, removeParagraphsFromEmailContents, sleep } from './utils';

export const removeParagraphsInEmailContents = async () => {
    printStartScript('Starting removeParagraphsInEmailContents');

    const startDate = Date.now();
    const voltaire = await loginToDatabase(process.env.VOLTAIRE_DATABASE!);

    let processed = 0;
    const count = await countEmailContents(voltaire);

    console.log(`\nGoing to update ${count} email contents`);
    await sleep(3000);

    while (processed < count) {
        const batch = await getEmailContentsBatch(voltaire, processed, EMAIL_CONTENTS_BATCH_SIZE);

        await bulkUpdateContents(
            voltaire,
            batch
                .filter(isMailContent)
                .map((content) =>
                    buildEmailContentUpdate({ _id: content._id, newContent: removeParagraphsFromEmailContents(content.params.emailContent) }),
                ),
        );

        processed += batch.length;
        printProgress(processed, count, startDate);
    }

    await disconnectFromDatabase();
    process.exit(1);
};
