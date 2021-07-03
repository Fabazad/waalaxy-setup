import MirageClient from '@waapi/mirage';
import OnuClient from '@waapi/onu';
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

    const userPermissions = await UserPermission.find({ waapiId: '5fae96fc18bc59002349336d' });

    console.log(userPermissions.length);

    let i = 0;
    for (const userPermission of userPermissions) {
        const { waapiId } = userPermission;
        const { _id: paymentWaapiId } = await onuClient.createEntity({ additionalData: {}, relatedTo: waapiId });
        await UserPermission.updateOne({ _id: userPermission._id }, { $set: { paymentWaapiId } });

        const { stripeCustomerId } = await mirage.fetchClient(waapiId);
        await mirage.intervertPaymentData(stripeCustomerId!, paymentWaapiId);
        console.log(`${++i}/${userPermissions.length}`);
    }
    console.log('End');
    process.exit(1);
};

main();
