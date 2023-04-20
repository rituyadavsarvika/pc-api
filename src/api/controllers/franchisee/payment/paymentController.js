// const config = require('../../../../../config/keys');
// const stripe = require('stripe')(config.STRIPE_SECRET_KEY);

const catchAsync = require('../../../../utils/error/catchAsync');
const APIFeature = require('./../../../../utils/apiFeatures');

// Load Service
const stripeService = require('../../../../../service/stripeService');
const subscriberConfigService = require('./../../../../../service/subscriberConfigService');
const subscriptionHistoryService = require('./../../../../../service/subscriptionHistoryService');

// Load Model
const Subscriber = require('./../../../../models/franchisee/franchiseeModel');
const SubscriberConfig = require('./../../../../models/config/subscriberConfigModel');
const User = require('./../../../../models/auth/usersModel');
const SubscriptionHistory = require('./../../../../models/franchisee/history/subscriptionHistoryModel');
const PaymentHistory = require('./../../../../models/franchisee/history/paymentHistoryModel');

// controller to make subscription Payment
const makeSubscriptionPayment = (req, res) => {
    const { token, franchiseeId, subscriptionPlanId } = req.body;
    let {
        franchiseeName,
        email,
        name,
        planType,
        regularPrice,
        offerPrice,
        priceId,
        features,
        attributes
    } = req;

    offerPrice = parseFloat(offerPrice);

    // generate subscription expire at
    const today = new Date();
    subscriberConfigService
        .generateDate(planType, today)
        .then(subscriptionExpireAt => {
            if (offerPrice > 0.0) {
                stripeService
                    .createStripePackages(
                        franchiseeName,
                        token,
                        offerPrice,
                        email,
                        priceId,
                        planType
                    )
                    .then(stripeSubscription => {
                        const nextChargeAt =
                            stripeSubscription?.current_period_end * 1000;

                        const stripeSubscriptionId = stripeSubscription?.id;

                        // set stripe customerId in franchisee Document
                        const updatedSubscriber = Subscriber.findByIdAndUpdate(
                            franchiseeId,
                            {
                                $set: {
                                    stripeCustomerId:
                                        stripeSubscription?.customer,
                                    stripeSubscriptionId: stripeSubscription.id
                                }
                            }
                        );

                        return Promise.all([
                            nextChargeAt,
                            stripeSubscriptionId,
                            updatedSubscriber
                        ]);
                    })
                    .then(
                        ([
                            nextChargeAt,
                            stripeSubscriptionId,
                            updatedSubscriber
                        ]) => {
                            const updatedConfig = SubscriberConfig.updateOne(
                                { franchiseeId },
                                {
                                    $set: {
                                        subscriptionPlanId,
                                        subscriptionExpireAt,
                                        planType,
                                        planPrice: offerPrice,
                                        attributes
                                    }
                                }
                            );

                            return Promise.all([
                                nextChargeAt,
                                stripeSubscriptionId,
                                updatedConfig
                            ]);
                        }
                    )
                    .then(
                        ([
                            nextChargeAt,
                            stripeSubscriptionId,
                            updatedConfig
                        ]) => {
                            const updatedUsers = User.updateOne(
                                { franchiseeId },
                                { $set: { subscriptionExpireAt } }
                            );

                            return Promise.all([
                                nextChargeAt,
                                stripeSubscriptionId,
                                updatedUsers
                            ]);
                        }
                    )
                    .then(
                        ([
                            nextChargeAt,
                            stripeSubscriptionId,
                            updatedUsers
                        ]) => {
                            res.status(200).json({
                                status: 'success',
                                message: 'Payment successful'
                            });

                            return Promise.all([
                                nextChargeAt,
                                stripeSubscriptionId,
                                updatedUsers
                            ]);
                        }
                    )
                    .then(
                        ([
                            nextChargeAt,
                            stripeSubscriptionId,
                            updatedUsers
                        ]) => {
                            return subscriptionHistoryService.insertHistory({
                                name,
                                stripeSubscriptionId,
                                subscriptionPlanId,
                                franchiseeId,
                                regularPrice,
                                offerPrice,
                                features,
                                planType,
                                attributes,
                                startAt: today,
                                nextChargeAt: new Date(nextChargeAt),
                                status: 'active'
                            });
                        }
                    )
                    .catch(err =>
                        res.status(500).json({
                            status: 'fail',
                            message: `${err?.name} ${err?.message}`
                        })
                    );
            } else {
                subscriptionHistoryService
                    .insertHistory({
                        name,
                        subscriptionPlanId,
                        franchiseeId,
                        regularPrice,
                        offerPrice,
                        features,
                        planType,
                        attributes,
                        startAt: today,
                        status: 'active'
                    })
                    .then(() => {
                        res.status(200).json({
                            status: 'success',
                            message: 'Nothing to pay'
                        });
                    })
                    .catch(err =>
                        res.status(500).json({
                            status: 'fail',
                            message: `${err?.name} ${err?.message}`
                        })
                    );
            }
        })
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
};

// controller to retake subscription
const retakeSubscription = (req, res) => {
    const { token, franchiseeId, subscriptionPlanId } = req.body;

    let {
        stripeCustomerId,
        name,
        planType,
        regularPrice,
        offerPrice,
        priceId,
        features,
        attributes
    } = req;

    offerPrice = parseFloat(offerPrice);

    // generate subscription expire at
    const today = new Date();

    subscriberConfigService
        .generateDate(planType, today)
        .then(subscriptionExpireAt => {
            const stripeSubscription = stripeService.retakeSubscription(
                stripeCustomerId,
                priceId,
                token?.paymentMethodId,
                planType
            );
            return Promise.all([subscriptionExpireAt, stripeSubscription]);
        })
        .then(([subscriptionExpireAt, stripeSubscription]) => {
            const nextChargeAt = stripeSubscription?.current_period_end * 1000;

            const stripeSubscriptionId = stripeSubscription?.id;

            // set stripe customerId in franchisee Document
            const updatedSubscriber = Subscriber.findByIdAndUpdate(
                franchiseeId,
                {
                    $set: {
                        stripeSubscriptionId: stripeSubscription.id
                    }
                }
            );

            return Promise.all([
                nextChargeAt,
                stripeSubscriptionId,
                updatedSubscriber,
                subscriptionExpireAt
            ]);
        })
        .then(
            ([
                nextChargeAt,
                stripeSubscriptionId,
                updatedSubscriber,
                subscriptionExpireAt
            ]) => {
                const updatedConfig = SubscriberConfig.updateOne(
                    { franchiseeId },
                    {
                        $set: {
                            subscriptionPlanId,
                            subscriptionExpireAt,
                            planType,
                            planPrice: offerPrice,
                            attributes
                        }
                    }
                );

                return Promise.all([
                    nextChargeAt,
                    stripeSubscriptionId,
                    updatedConfig,
                    subscriptionExpireAt
                ]);
            }
        )
        .then(
            ([
                nextChargeAt,
                stripeSubscriptionId,
                updatedConfig,
                subscriptionExpireAt
            ]) => {
                const updatedUsers = User.updateOne(
                    { franchiseeId },
                    { $set: { subscriptionExpireAt } }
                );

                return Promise.all([
                    nextChargeAt,
                    stripeSubscriptionId,
                    updatedUsers
                ]);
            }
        )
        .then(([nextChargeAt, stripeSubscriptionId, updatedUsers]) => {
            res.status(200).json({
                status: 'success',
                message: 'Subscription successfully taken'
            });

            return Promise.all([
                nextChargeAt,
                stripeSubscriptionId,
                updatedUsers
            ]);
        })
        .then(([nextChargeAt, stripeSubscriptionId, updatedUsers]) => {
            return subscriptionHistoryService.insertHistory({
                name,
                stripeSubscriptionId,
                subscriptionPlanId,
                franchiseeId,
                regularPrice,
                offerPrice,
                features,
                planType,
                attributes,
                startAt: today,
                nextChargeAt: new Date(nextChargeAt),
                status: 'active'
            });
        })
        .catch(err =>
            res.status(500).json({
                status: 'fail',
                message: `${err?.name} ${err?.message}`
            })
        );
};

// Controller to add new card type payment method
const addNewPaymentMethod = catchAsync(async (req, res) => {
    const { token } = req.body;
    const paymentMethod = await stripeService.createPaymentMethod(token?.card);

    res.status(201).json({ status: 'success', data: paymentMethod });
});

// Controller to add new card type payment method
const attachedPaymentMethodWithCustomer = catchAsync(async (req, res) => {
    const { token, customerId } = req.body;
    stripeService
        .attachedPaymentMethodWithCustomer(customerId, token)
        .then(paymentMethod =>
            res.status(201).json({ status: 'success', data: paymentMethod })
        )
        .catch(err =>
            res.status(400).json({ status: 'fail', message: err.message })
        );
});

// controller to set customer default payment method
const setDefaultPaymentMethod = (req, res) => {
    const { customerId, paymentMethodId } = req.body;
    const stripeSubscriptionId = req.subscriptionId;
    stripeService
        .setSubscriptionDefaultPaymentMethod(
            customerId,
            paymentMethodId,
            stripeSubscriptionId
        )
        .then(updatedSubscription =>
            res.status(201).json({
                status: 'success',
                data: updatedSubscription
            })
        )
        .catch(err =>
            res.status(400).json({ status: 'fail', message: err.message })
        );
};

// controller to get payment method details
const retrievePaymentMethod = (req, res) => {
    const paymentMethodId = req.params.id;

    console.log("paymentMethodId:::", paymentMethodId);

    stripeService
        .retrievePaymentMethod(paymentMethodId)
        .then(paymentMethod =>
            res.status(201).json({
                status: 'success',
                data: paymentMethod
            })
        )
        .catch(err =>
            res.status(400).json({ status: 'fail', message: err.message })
        );
};

// controller to get customer wise payment method list
const getCustomerWisePaymentMethods = catchAsync(async (req, res) => {
    const customerId = req.params.customerId;

    stripeService
        .getCustomerWisePaymentMethods(customerId)
        .then(paymentMethodList =>
            res.status(201).json({
                status: 'success',
                data: paymentMethodList
            })
        )
        .catch(err =>
            res.status(400).json({ status: 'fail', message: err.message })
        );
});

// Controller to retrieve invoice
const retrieveInvoice = (req, res) => {
    stripeService
        .retrieveInvoice(req.params.invoiceId)
        .then(invoice => {
            res.status(201).json({
                status: 'success',
                data: invoice
            });
        })
        .catch(err => {
            res.status(400).json({ status: 'fail', message: err.message });
        });
};

// controller to upgrade subscription plan
const upgradeSubscriberSubscription = (req, res) => {
    let stripeSubscriptionId = req.subscriptionId;
    const { token, franchiseeId, subscriptionPlanId } = req.body;

    let {
        name,
        franchiseeName,
        email,
        planType,
        regularPrice,
        features,
        offerPrice,
        priceId,
        attributes,
        stripeCustomerId,
        status
    } = req;

    if (stripeSubscriptionId && stripeCustomerId && status === 'active') {
        // update subscription with new product, price & subscription time (billing interval)
        stripeService
            .upgradeSubscriberSubscription(
                stripeCustomerId,
                stripeSubscriptionId,
                priceId,
                token
            )
            .then(stripeSubscription => {
                const nextChargeAt =
                    stripeSubscription?.current_period_end * 1000;

                const updatedSubscriber = Subscriber.findByIdAndUpdate(
                    franchiseeId,
                    {
                        $set: {
                            stripeSubscriptionId: stripeSubscription.id
                        }
                    }
                );

                return Promise.all([nextChargeAt, updatedSubscriber]);
            })
            .then(([nextChargeAt, updatedFranchisee]) => {
                const today = new Date();
                const subscriptionExpireAt =
                    subscriberConfigService.generateDate(planType, today);

                return Promise.all([nextChargeAt, subscriptionExpireAt]);
            })
            .then(([nextChargeAt, subscriptionExpireAt]) => {
                const updatedSubscriberConfig = SubscriberConfig.updateOne(
                    { franchiseeId },
                    {
                        $set: {
                            subscriptionPlanId,
                            subscriptionExpireAt,
                            planType,
                            planPrice: offerPrice,
                            attributes
                        }
                    }
                );

                return Promise.all([
                    nextChargeAt,
                    updatedSubscriberConfig,
                    subscriptionExpireAt
                ]);
            })
            .then(
                ([
                    nextChargeAt,
                    updatedSubscriberConfig,
                    subscriptionExpireAt
                ]) => {
                    const users = User.updateMany(
                        { franchiseeId },
                        { $set: { subscriptionExpireAt } }
                    );

                    return Promise.all([nextChargeAt, users]);
                }
            )
            .then(([nextChargeAt, users]) => {
                // marked subscription as cancelled
                const updatedSubscriptionHistory =
                    SubscriptionHistory.updateMany(
                        {
                            franchiseeId
                        },
                        {
                            $unset: { nextChargeAt: 1 },
                            $set: {
                                status: 'cancelled',
                                cancelledAt: new Date()
                            }
                        }
                    );

                return Promise.all([nextChargeAt, updatedSubscriptionHistory]);
            })
            .then(([nextChargeAt, updatedSubscriptionHistory]) => {
                const history = subscriptionHistoryService.insertHistory({
                    name,
                    stripeSubscriptionId,
                    subscriptionPlanId,
                    franchiseeId,
                    regularPrice,
                    offerPrice,
                    features,
                    planType,
                    attributes,
                    startAt: new Date(),
                    nextChargeAt: new Date(nextChargeAt),
                    status: 'active'
                });

                return Promise.all([nextChargeAt, history]);
            })
            .then(([nextChargeAt, history]) => {
                res.status(201).json({
                    status: 'success',
                    message: 'Plan upgrade successful'
                });
            })
            .catch(err => {
                console.log('err from controller', err);
                res.status(400).json({ status: 'fail', message: err.message });
            });
    } else {
        stripeService
            .createStripePackages(
                franchiseeName,
                token,
                offerPrice,
                email,
                priceId,
                planType
            )
            .then(stripeSubscription => {
                const nextChargeAt =
                    stripeSubscription?.current_period_end * 1000;

                stripeSubscriptionId = stripeSubscription?.id;

                const updatedSubscriber = Subscriber.findByIdAndUpdate(
                    franchiseeId,
                    {
                        $set: {
                            stripeCustomerId: stripeSubscription?.customer,
                            stripeSubscriptionId: stripeSubscription?.id
                        }
                    }
                );

                return Promise.all([updatedSubscriber, nextChargeAt]);
            })
            .then(([updatedFranchisee, nextChargeAt]) => {
                const today = new Date();
                const subscriptionExpireAt =
                    subscriberConfigService.generateDate(planType, today);

                return Promise.all([subscriptionExpireAt, nextChargeAt]);
            })
            .then(([subscriptionExpireAt, nextChargeAt]) => {
                const updatedSubscriberConfig = SubscriberConfig.updateOne(
                    { franchiseeId },
                    {
                        $set: {
                            subscriptionPlanId,
                            subscriptionExpireAt,
                            planType,
                            planPrice: offerPrice,
                            attributes
                        }
                    }
                );
                return Promise.all([
                    updatedSubscriberConfig,
                    subscriptionExpireAt,
                    nextChargeAt
                ]);
            })
            .then(
                ([
                    updatedSubscriberConfig,
                    subscriptionExpireAt,
                    nextChargeAt
                ]) => {
                    const users = User.updateMany(
                        { franchiseeId },
                        { $set: { subscriptionExpireAt } }
                    );

                    return Promise.all([users, nextChargeAt]);
                }
            )
            .then(([users, nextChargeAt]) => {
                // marked subscription as cancelled
                const updatedSubscriptionHistory =
                    SubscriptionHistory.updateMany(
                        {
                            franchiseeId
                        },
                        {
                            $unset: { nextChargeAt: 1 },
                            $set: {
                                status: 'cancelled',
                                cancelledAt: new Date()
                            }
                        }
                    );

                return Promise.all([nextChargeAt, updatedSubscriptionHistory]);
            })
            .then(([nextChargeAt, updatedSubscriptionHistory]) => {
                return subscriptionHistoryService.insertHistory({
                    name,
                    stripeSubscriptionId,
                    subscriptionPlanId,
                    franchiseeId,
                    regularPrice,
                    offerPrice,
                    features,
                    planType,
                    attributes,
                    startAt: new Date(),
                    nextChargeAt: nextChargeAt ? new Date(nextChargeAt) : null,
                    status: 'active'
                });
            })
            .then(() =>
                res.status(200).json({
                    status: 'success',
                    message: 'Plan upgrade successful'
                })
            )
            .catch(err => {
                console.log('err', err);
                res.status(500).json({
                    status: 'fail',
                    message: `${err?.name} ${err?.message}`
                });
            });
    }
};

// controller to get all payment history
const getAllPayments = catchAsync(async (req, res) => {
    const feature = new APIFeature(
        PaymentHistory.find()
            .populate({
                path: 'subscriptionPlanId',
                model: 'SubscriptionPlan',
                select: 'name summary'
            })
            .populate({
                path: 'subscriptionHistoryId',
                model: 'SubscriptionHistory',
                select: 'name'
            }),
        req.query
    )
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const paymentList = await feature.query;

    // get count
    const cQuery = new APIFeature(
        PaymentHistory.countDocuments(),
        req.query
    ).countFilter();
    const docCount = await cQuery.query;

    Promise.all([paymentList, docCount]).then(() => {
        res.status(200).json({
            status: 'success',
            result: docCount,
            data: paymentList
        });
    });
});

// controller to get payment details
const getPaymentDetails = catchAsync(async (req, res) => {
    const paymentDetails = await PaymentHistory.findOne({
        _id: req.params.paymentHistoryId
    })
        .populate({
            path: 'subscriptionPlanId',
            model: 'SubscriptionPlan',
            select: 'name summary'
        })
        .populate({
            path: 'subscriptionHistoryId',
            model: 'SubscriptionHistory',
            select: 'name'
        });

    res.status(200).json({
        status: 'success',
        data: paymentDetails
    });
});

// Load Model
// const Transaction = require('../../../../models/franchisee/payment/transaction.model');
// const Order = require('../../../../models/franchisee/orders.model');

// get stripe publishable keys
// const getStripePublishableKey = catchAsync(async (req, res, next) => {
// 	const pKeys = config.STRIPE_PUBLIC_KEY;

// 	if (!pKeys) {
// 		return next(new AppError('Stripe Keys not found', 404));
// 	}

// 	res.status(200).json({ status: 'success', key: pKeys });
// });

// card payment from stripe
// const makeCardPayment = catchAsync(async (req, res, next) => {
// 	const { token, order } = req.body;

// 	// stripe charge payment
// 	stripe.paymentIntents
// 		.create({
// 			amount: order?.total * 100, // to convert cents to usd
// 			currency: 'usd',
// 			payment_method_types: ['card'],
// 			payment_method: token.id,
// 			description: `card payment of ${order.total} for order 6735`,
// 			metadata: {
// 				order_id: order?._id
// 			},
// 			confirm: true,
// 			receipt_email: token?.billing_details?.email
// 		})
// 		.then(paymentIntent => {
// 			// send back user response
// 			res.status(200).json({ status: 'success' });

// 			// insert new document in transaction table
// 			Transaction.create({
// 				orderId: order._id,
// 				paymentDate: paymentIntent.created,
// 				transactionId: paymentIntent.id,
// 				paymentMethodId: paymentIntent.payment_method,
// 				amount: parseFloat(paymentIntent.amount) / 100,
// 				amountCapturable:
// 					parseFloat(paymentIntent.amount_capturable) / 100,
// 				amountReceived: parseFloat(paymentIntent.amount_received) / 100,
// 				brand: paymentIntent.charges.data[0].payment_method_details.card
// 					.brand,
// 				last4: paymentIntent.charges.data[0].payment_method_details.card
// 					.last4,
// 				currency: paymentIntent.currency,
// 				status: paymentIntent.status
// 			})
// 				.then(transactionDoc => {
// 					// update Order status, payment status and set transactionId
// 					Order.findByIdAndUpdate(
// 						order._id,
// 						{
// 							$set: {
// 								status: 'PROCESSING',
// 								paymentStatus: 'PAID',
// 								transactionId: transactionDoc._id
// 							}
// 						},
// 						{
// 							new: true,
// 							runValidators: true
// 						}
// 					)
// 						.then(() => console.log('order update Done'))
// 						.catch(err => console.log('order updated failed', err));
// 				})
// 				.catch(err => console.log('Transaction insertion failed', err));
// 		})
// 		.catch(err => next(new AppError(`${err.name}, ${err.message}`, 500)));
// });

module.exports = {
    makeSubscriptionPayment,
    retakeSubscription,
    addNewPaymentMethod,
    attachedPaymentMethodWithCustomer,
    setDefaultPaymentMethod,
    retrievePaymentMethod,
    getCustomerWisePaymentMethods,
    retrieveInvoice,
    upgradeSubscriberSubscription,
    getAllPayments,
    getPaymentDetails
};
