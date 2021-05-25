import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

mongoose.Promise = Promise;

export function loginToDatabase(uri: string): Promise<mongoose.Connection> {
    // Connect to Mongoose
    const instance = mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    return new Promise((resolve, reject) => {
        instance
            .once('open', async () => {
                console.log(`Connected to mongoDB`);
                resolve(instance);
            })
            .on('error', (error: Error) => {
                console.log('Connection error:', error);
                reject();
            });
    });
}

export function disconnectFromDatabase(): Promise<void> {
    return mongoose.disconnect();
}
