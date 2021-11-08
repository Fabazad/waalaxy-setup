import { Connection } from 'mongoose';
import { BulkUpdate } from './persistance/dao';
import { Campaign, OldCampaign, OldTraveler, Traveler } from './persistance/interfaces';

export type DenormalizeFunctionParams<Data> = {
    connection: Connection;
    onProcess: (nb: number) => void;
    alreadyProcessed?: number;
    count: number;
    getBatch: (processed: number) => Promise<Array<Data>>;
    buildTravelerUpdate: (data: Data) => BulkUpdate<Traveler | OldTraveler>;
    buildCampaignUpdate: (data: Data) => BulkUpdate<Campaign | OldCampaign>;
};
