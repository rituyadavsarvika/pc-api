// Load utils
const catchAsync = require('./../src/utils/error/catchAsync');
const DATEUTILS = require('./../src/utils/dateTime');

// load model
const SubscriberConfig = require('../src/models/config/subscriberConfigModel');

// const getSuperAdminDoc = () => {
//     return new Promise(
//         catchAsync(async (resolve, reject) => {
//             const doc = await SubscriberConfig.findOne({
//                 adminType: 'SA'
//             }).select(
//                 'verification_timeout trial_timeout trial_gracetime media'
//             );
//             resolve(doc);
//         })
//     );
// };

const generateDate = (planType, baseTime) => {
    return new Promise((resolve, reject) => {
        const days = planType === 'monthly' ? 30 : 365;
        const data = DATEUTILS.addDays(baseTime, days);

        resolve(data);

        if (!data)
            reject({
                message: `${err?.name} ${err?.message}`
            });
    });
};

const createNew = (
    franchiseeId,
    subscriptionPlanId,
    subscriptionPlanType,
    subscriptionAttributes,
    price
) => {
    return new Promise((resolve, reject) => {
        // const superConfig = await getSuperAdminDoc();
        const today = new Date();
        generateDate(subscriptionPlanType, today)
            .then(subscriptionExpireAt => {
                return SubscriberConfig.create({
                    adminType: 'CA',
                    franchiseeId,
                    subscriptionPlanId,
                    subscriptionTakenAt: today,
                    subscriptionExpireAt,
                    planPrice: price,
                    attributes: subscriptionAttributes,
                    planType: subscriptionPlanType
                });
            })
            .then(newConfig => resolve(newConfig))
            .catch(err =>
                reject({
                    message: `${err?.name} ${err?.message}`
                })
            );
    });
};

// const getSuperAdminDoc = async () => {
//     await Promise.resolve();
//     SubscriberConfig.findOne({})
//         .exec()
//         .then(doc => {
//             console.log('doc', doc);
//             return doc;
//         });
// };

module.exports = {
    createNew,
    generateDate
};
