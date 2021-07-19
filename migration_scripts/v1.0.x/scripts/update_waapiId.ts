import MirageClient from '@waapi/mirage';
import OnuClient from '@waapi/onu';
import _ from 'lodash';
import mongoose from 'mongoose';
import { loginToDatabase } from '../../../mongoose';

const UserPermissionSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, unique: true },
        waapiId: { type: String, required: true, unique: true },
        paymentWaapiId: { type: String, required: true },
        permissions: {
            included: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
            },
            excluded: {
                type: [
                    {
                        name: { type: String, required: true },
                        params: { type: Object },
                    },
                ],
                required: true,
            },
        },
        plan: {
            name: { type: String, required: true },
            expirationDate: { type: Date },
            startDate: { type: Date, required: true },
            periodicity: { type: String, enum: ['monthly', 'quarterly', 'yearly', 'lifeTime', 'weekly'], required: true },
        },
    },
    { timestamps: true },
);

const main = async () => {
    const mirage = new MirageClient(process.env.MIRAGE_TOKEN!, true);
    const onuClient = new OnuClient('waalaxy', `Bearer ${process.env.WAAPI_API_TOKEN}`);

    const bouncerDatabase = await loginToDatabase(process.env.BOUNCER_DATABASE!);
    const UserPermission = bouncerDatabase.model<any & mongoose.Document>('UserPermission', UserPermissionSchema);

    const userPermissions = await UserPermission.find({
        paymentWaapiId: { $exists: false },
    });

    console.log(userPermissions.length);

    let i = 0;
    const chunked = _.chunk(userPermissions, 10);
    for (const chunk of chunked) {
        await Promise.all(
            chunk.map(async (userPermission) => {
                const { waapiId } = userPermission;
                try {
                    const { _id: paymentWaapiId } = await onuClient.createEntity({ additionalData: {}, relatedTo: waapiId });
                    console.log('created');
                    await UserPermission.updateOne({ _id: userPermission._id }, { $set: { paymentWaapiId } });

                    const { stripeCustomerId } = await mirage.fetchClient(waapiId);
                    await mirage.intervertPaymentData(stripeCustomerId!, paymentWaapiId);
                } catch (e) {
                    console.log(waapiId);
                    console.log(e.message);
                }
            }),
        );
        i += 10;
        console.log(`${i}/${userPermissions.length}`);
    }
    console.log('End');
    process.exit(1);
};

main();
