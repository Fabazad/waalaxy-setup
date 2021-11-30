import dotEnv from 'dotenv';
import { Connection } from 'mongoose';
import { loginToDatabase } from '../../../../mongoose';
import { printProgress } from '../../../scriptHelper';
import { IVoltaireMetadata, IVoltaireContent } from './interfaces';
import { VoltaireContentModel, VoltaireMetadataModel } from './schemas';
dotEnv.config();

const PAUSE_BETWEEN_BATCH = 1000;
const COUNT_PAUSE_MODULO = 100;

const countUserVoltaireContent = (c: Connection): Promise<Array<string>> => VoltaireContentModel(c).distinct('user').exec();

const getFirstLinkedinConnectTemplate = (c: Connection, user: string): Promise<IVoltaireContent | null> =>
    VoltaireContentModel(c)
        .findOne({
            user,
            type: 'connect',
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

const getFirstLinkedinMessageTemplate = (c: Connection, user: string): Promise<IVoltaireContent | null> =>
    VoltaireContentModel(c)
        .findOne({
            user,
            type: 'message',
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

const getFirstEmailTemplate = (c: Connection, user: string): Promise<IVoltaireContent | null> =>
    VoltaireContentModel(c)
        .findOne({
            user,
            type: 'email',
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

const updateMetadata = (
    c: Connection,
    params: {
        templates: {
            firstLinkedinConnect?: string;
            firstLinkedinMessage?: string;
            firstEmail?: string;
        };
        user: string;
    },
): Promise<IVoltaireMetadata | null> => {
    const {
        user,
        templates: { firstLinkedinMessage, firstLinkedinConnect, firstEmail },
    } = params;
    return VoltaireMetadataModel(c)
        .updateOne(
            {
                user: user,
            },
            {
                $set: {
                    ...(firstEmail !== undefined ? { firstEmailTemplateCreatedAt: firstEmail } : {}),
                    ...(firstLinkedinConnect !== undefined ? { firstLinkedinConnectTemplateCreatedAt: firstLinkedinConnect } : {}),
                    ...(firstLinkedinMessage !== undefined ? { firstLinkedinMessageTemplateCreatedAt: firstLinkedinMessage } : {}),
                },
            },
            { upsert: true },
        )
        .exec();
};

export const updateMetadataVoltaire = async () => {
    console.log('Running updateMetadataVoltaire');
    const voltaireDatabase = await loginToDatabase(process.env.VOLTAIRE_DATABASE!);
    const now = Date.now();

    const usersToCheck = await countUserVoltaireContent(voltaireDatabase);

    console.log(`Found: ${usersToCheck.length} to update`);

    let processedUsers = 0;
    let updatedMetadata = 0;

    for await (const user of usersToCheck) {
        const [linkedinConnect, linkedinMessage, email] = await Promise.all([
            getFirstLinkedinConnectTemplate(voltaireDatabase, user),
            getFirstLinkedinMessageTemplate(voltaireDatabase, user),
            getFirstEmailTemplate(voltaireDatabase, user),
        ]);

        const metadata = await updateMetadata(voltaireDatabase, {
            user,
            templates: {
                ...(linkedinConnect ? { firstLinkedinConnect: linkedinConnect.createdAt } : {}),
                ...(linkedinMessage ? { firstLinkedinMessage: linkedinMessage.createdAt } : {}),
                ...(email ? { firstEmail: email.createdAt } : {}),
            },
        });

        if (metadata) updatedMetadata += 1;

        processedUsers += 1;

        if (processedUsers % COUNT_PAUSE_MODULO === 0) {
            await new Promise((r) => {
                setTimeout(r, PAUSE_BETWEEN_BATCH);
            });

            console.log(`${updatedMetadata} metadata updated on ${usersToCheck.length} users`);
        }

        printProgress(processedUsers, usersToCheck.length, now);
    }

    await voltaireDatabase.close();

    console.log('updated voltaire metadata', updatedMetadata);
    console.log('Done !');

    process.exit();
};

updateMetadataVoltaire();
