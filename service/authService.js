const moment = require('moment');

// Load utils
const catchAsync = require('./../src/utils/error/catchAsync');
const VALIDATOR = require('./../src/utils/validator');

// Load Model
const User = require('./../src/models/auth/usersModel');
const franchisee = require('./../src/models/franchisee/franchiseeModel');
const SubscriberConfig = require('./../src/models/config/subscriberConfigModel');

// Load service
const subscriberConfigService = require('./../service/subscriberConfigService');

// service that will update user document status to TOKEN_EXPIRED depending on tokenExpiredTime
const makeSubscriptionExpired = catchAsync(async () => {
    const currentTime = moment().utc().format();

    // Update posts
    await User.updateMany(
        {
            active: true,
            subscriptionExpireAt: {
                $lte: currentTime
            }
        },
        {
            $unset: { subscriptionExpireAt: 1 },
            $set: { status: 'SUBSCRIPTION_EXPIRED' }
        }
    );
});

// update trialExpireAt
const updateSubscriptionExpireAt = (subscriptionExpireAt, franchiseeId) => {
    return (promise = new Promise((resolve, reject) => {
        SubscriberConfig.updateOne(
            { franchiseeId },
            { $set: { subscriptionExpireAt, subscriptionExpireAt } },
            { runValidators: true }
        )
            .then(config => {
                return User.updateMany(
                    { franchiseeId },
                    {
                        $set: {
                            subscriptionExpireAt: subscriptionExpireAt,
                            status: 'SUBSCRIBED'
                        }
                    },
                    { runValidators: true }
                );
            })
            .then(users => {
                resolve();
            })
            .catch(() => reject());
    }));
};

// service to update subscription information
const subscriptionTrigger = stripeCustomerId => {
    return (promise = new Promise((resolve, reject) => {
        franchisee
            .findOne({ stripeCustomerId })
            .then(franchisee => {
                if (VALIDATOR.isEmptyObject(franchisee))
                    return reject({ message: 'invalid customer' });

                const subscriberConfig = SubscriberConfig.findOne({
                    franchiseeId: franchisee?._id
                });

                return Promise.all([franchisee?._id, subscriberConfig]);
            })
            .then(([franchiseeId, subscriberConfig]) => {
                // generate subscription expire at
                if (VALIDATOR.isEmptyObject(subscriberConfig))
                    return reject({ message: 'invalid customer' });

                const today = new Date();
                const subscriptionExpireAt =
                    subscriberConfigService.generateDate(
                        subscriberConfig?.planType,
                        today
                    );

                return Promise.all([franchiseeId, subscriptionExpireAt]);
            })
            .then(([franchiseeId, subscriptionExpireAt]) => {
                const updatedConfig = SubscriberConfig.updateOne(
                    {
                        franchiseeId
                    },
                    { $set: { subscriptionExpireAt } }
                );
                return Promise.all([
                    franchiseeId,
                    subscriptionExpireAt,
                    updatedConfig
                ]);
            })
            .then(([franchiseeId, subscriptionExpireAt, updatedConfig]) => {
                const updatedUser = User.updateMany(
                    { franchiseeId },
                    {
                        $set: {
                            status: 'SUBSCRIBED',
                            active: true,
                            subscriptionExpireAt
                        }
                    }
                );

                return franchiseeId;
            })
            .then(franchiseeId => resolve(franchiseeId))
            .catch(err =>
                reject({
                    message: err
                })
            );
    }));
};

module.exports = {
    makeSubscriptionExpired,
    updateSubscriptionExpireAt,
    subscriptionTrigger
};
