import { Connection } from 'mongoose';
import EventEmitter from 'stream';
import { BulkUpdate } from './persistance/dao';
import { Campaign, OldCampaign, OldTraveler, Traveler } from './persistance/interfaces';

export type DenormalizeFunctionParams<Data> = {
    connection: Connection;
    onProcess: (nb: number) => void;
    eventEmitter: EventEmitter;
    buildTravelerUpdate: (data: Data) => BulkUpdate<Traveler | OldTraveler>;
    buildCampaignUpdate: (data: Data) => BulkUpdate<Campaign | OldCampaign>;
};
