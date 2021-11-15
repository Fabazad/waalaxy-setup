// eslint-disable-next-line import/no-extraneous-dependencies
import { BulkWriteOperation } from 'mongodb';
import { Connection } from 'mongoose';
import { IContent } from './interfaces';
import { ContentModel } from './schemas';

const emailContentsConditions = { channel: 'email', type: 'email' };

export const countEmailContents = (c: Connection) => ContentModel(c).count(emailContentsConditions).exec();
export const getEmailContentsBatch = (c: Connection, start: number, size: number) =>
    ContentModel(c).find(emailContentsConditions).skip(start).limit(size).lean().exec();

export type BulkUpdate<T> = Array<BulkWriteOperation<T>>;
export const bulkUpdateContents = (c: Connection, updates: BulkUpdate<IContent>) => ContentModel(c).bulkWrite(updates);

export const buildEmailContentUpdate = ({ _id, newContent }: { _id: string; newContent: string }) => ({
    updateOne: {
        filter: { _id },
        update: {
            $set: {
                'params.emailContent': newContent,
            },
        },
    },
});
