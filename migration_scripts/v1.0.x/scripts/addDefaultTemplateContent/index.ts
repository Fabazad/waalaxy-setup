import dotEnv from 'dotenv';
import { disconnectFromDatabase, loginToDatabase } from '../../../../mongoose';
import { printStartScript } from '../../../scriptHelper';
import { DefaultTemplateContentModel } from './schemas';

dotEnv.config();

const DEFAULT_CONTENT_FR = {
    language: 'fr',
    noteContentValues: { name: "J'aimerais rejoindre votre réseau", noteContent: "Bonjour,\n J'aimerais beaucoup rejoindre votre réseau :)" },
    messageContentValues: { name: 'Merci acceptation', messageContent: "Merci d'avoir accepté mon invitation, au plaisir !" },
};

const DEFAULT_CONTENT_EN = {
    language: 'en',
    noteContentValues: { name: 'Would love to join your network', noteContent: 'Hi,\nI would love to join your network :)' },
    messageContentValues: { name: 'Thank you for accepting', messageContent: 'Thank you for accepting my invitation, much appreciated!' },
};

export const addDefaultTemplateContent = async () => {
    printStartScript('Starting addDefaultTemplateContent');
    const VoltaireDatabase = await loginToDatabase(process.env.VOLTAIRE_DATABASE!);
    await DefaultTemplateContentModel(VoltaireDatabase).create(DEFAULT_CONTENT_FR);
    await DefaultTemplateContentModel(VoltaireDatabase).create(DEFAULT_CONTENT_EN);
    await disconnectFromDatabase();
    console.log('Exiting');
};
