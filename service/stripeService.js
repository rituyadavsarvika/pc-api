const LOGGER = require('./../config/logger');
const CONFIG = require('../config/keys');
const stripe = require('stripe')(CONFIG.STRIPE_SECRET_KEY);

// Load service
const authService = require('./../service/authService');

// load Model
const SubscriberConfig = require('./../src/models/config/subscriberConfigModel');
const SubscriptionHistory = require('./../src/models/franchisee/history/subscriptionHistoryModel');
const PaymentHistory = require('./../src/models/franchisee/history/paymentHistoryModel');
const SubscriptionPromotionCouponModel = require('../src/models/franchisee/payment/subscriptionPromotionCoupon.model');

// function to create a new payment Method
const createPaymentMethod = card => {
    return new Promise((resolve, reject) => {
        stripe.paymentMethods
            .create({
                type: 'card',
                card: {
                    number: card?.number,
                    exp_month: card?.exp_month,
                    exp_year: card?.exp_year,
                    cvc: card?.cvc
                },
                billing_details: { name: card?.name, email: card?.email }
            })
            .then(newPaymentMethod => {
                LOGGER.info(`Payment method created with ${card}`);
                resolve(newPaymentMethod);
            })
            .catch(err => {
                LOGGER.error(`Payment method creat failed for info ${card}`);
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to create new stripe customer
const createStripeCustomer = (name, email) => {
    return new Promise((resolve, reject) => {
        stripe.customers
            .create({
                name,
                email,
                description: `Stripe customer for email ${email}`,
                metadata: { email }
            })
            .then(customer => {
                LOGGER.info(
                    `custom created with name ${name} and email ${email}`
                );
                resolve(customer);
            })
            .catch(err => {
                LOGGER.error(
                    `custom creat failed for name ${name} and email ${email}`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to attached payment method to customer
const attachedPaymentMethodWithCustomer = (customerId, token) => {
    paymentMethodId = token.paymentMethodId.toString() || undefined;

    return new Promise((resolve, reject) => {
        stripe.paymentMethods
            .attach(paymentMethodId, {
                customer: customerId.toString()
            })
            .then(() =>
                stripe.paymentMethods.update(paymentMethodId, {
                    billing_details: { name: token?.name, email: token?.email }
                })
            )
            .then(paymentMethod => {
                LOGGER.info(
                    `payment method attach done with customer ${customerId} and token ${token}`
                );
                resolve(paymentMethod);
            })
            .catch(err => {
                console.log("err:::", err);
                LOGGER.error(
                    `payment method attach failed with customer ${customerId} and token ${token}`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to retrieve payment method details
const retrievePaymentMethod = paymentMethodId => {
    return new Promise((resolve, reject) => {
        stripe.paymentMethods
            .retrieve(paymentMethodId)
            .then(paymentMethod => {
                resolve(paymentMethod);
                LOGGER.info(
                    `Successfully retrieve payment method for ${paymentMethodId}`
                );
            })
            .catch(err => {
                LOGGER.error(
                    `retrieve payment method for ${paymentMethodId} failed`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to set default payment method for subscription
const setSubscriptionDefaultPaymentMethod = (
    customerId,
    paymentMethodId,
    stripeSubscriptionId
) => {
    return new Promise((resolve, reject) => {
        stripe.customers
            .update(customerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId.toString()
                }
            })
            .then(customer => {
                return stripe.subscriptions.update(stripeSubscriptionId, {
                    default_payment_method: paymentMethodId.toString()
                });
            })
            .then(updatedSubscription => {
                LOGGER.info(
                    `${paymentMethodId} set as default payment method for ${customerId} and subscriptionId ${stripeSubscriptionId}`
                );
                resolve(updatedSubscription);
            })
            .catch(err => {
                LOGGER.error;
                `${paymentMethodId} set as default payment method for ${customerId} and subscriptionId ${stripeSubscriptionId} failed`;
                reject({
                    message: err
                });
            });
    });
};

// function to create new stripe subscription
const createStripeSubscription = async (
    customerId,
    priceId,
    paymentMethodId,
    planType,
    token = null
) => {
    let createObject = {
        customer: customerId?.toString(),
        items: [
            {
                price: priceId?.toString(),
                quantity: '1'
            }
        ],
        default_payment_method: paymentMethodId?.toString(),
        collection_method: 'charge_automatically',
        // coupon: 'q6ln4SCP', //token?.promotionCode
    }

    if (token?.promotionCode) {
        const subscriptionPromotionCouponObj = await SubscriptionPromotionCouponModel
            .findOne({ adminType: 'SA', code: token?.promotionCode })

        createObject.promotion_code = subscriptionPromotionCouponObj?.promotionCodeId
        // createObject.coupon = subscriptionPromotionCouponObj?.couponId
        console.log("createObject:::", createObject);
    }


    return new Promise((resolve, reject) => {
        stripe.subscriptions
            .create(createObject)
            .then(subscription => {
                LOGGER.info(
                    `Stripe subscription create done for customer ${customerId} with priceId ${priceId} and payment method ${paymentMethodId}`
                );
                resolve(subscription);
            })
            .catch(err => {
                LOGGER.error(
                    `Stripe subscription create failed for customer ${customerId} with priceId ${priceId} and payment method ${paymentMethodId}`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to get customer wise payment method
const getCustomerWisePaymentMethods = customerId => {
    return new Promise((resolve, reject) => {
        stripe.paymentMethods
            .list({
                customer: customerId,
                type: 'card'
            })
            .then(paymentMethods => {
                if (paymentMethods?.data && paymentMethods?.data.length > 0) {
                    resolve(paymentMethods.data);
                    LOGGER.info(
                        `Retrieve payment method for customer ${customerId} done`
                    );
                } else
                    reject({
                        message: 'No payment method found'
                    });
            })
            .catch(err => {
                LOGGER.error(
                    `Retrieve payment method for customer ${customerId} failed`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to pay an invoice
const payInvoice = invoiceId => {
    return new Promise((resolve, reject) => {
        stripe.invoices
            .pay(invoiceId)
            .then(charge => {
                LOGGER.info(`Invoice payment done for invoiceId ${invoiceId}`);
                resolve(charge);
            })
            .catch(err => {
                LOGGER.error(
                    `Invoice payment failed for invoiceId ${invoiceId}`
                );
                reject({
                    message: err
                });
            });
    });
};

// root function control all function call at subscriber registration
const createStripePackages = (
    name,
    token,
    planPrice,
    customerEmail,
    priceId,
    planType
) => {
    const paymentMethodId = token?.paymentMethodId;

    console.log("token:::", token);

    return new Promise((resolve, reject) => {
        if (planPrice > 0.0) {
            createStripeCustomer(name, customerEmail)
                .then(async stripeCustomer => {
                    const attachment = attachedPaymentMethodWithCustomer(
                        stripeCustomer?.id,
                        token
                    );

                    
                    return Promise.all([stripeCustomer, attachment]);
                })
                .then(async ([stripeCustomer, attachment]) => {
                    const subscriptionPromotionCouponObj = await SubscriptionPromotionCouponModel
                        .findOne({ adminType: 'SA', code: token?.promotionCode })
    
                    console.log("subscriptionPromotionCouponObj:::", subscriptionPromotionCouponObj);


                    return createStripeSubscription(
                        stripeCustomer.id,
                        priceId,
                        paymentMethodId,
                        planType,
                        token
                    );
                })
                .then(subscription => {
                    payInvoice(subscription.latest_invoice);
                    return subscription;
                })
                .then(subscription => {
                    LOGGER.info(
                        `Stripe package creation done for name ${name} token ${token} planPrice ${planPrice} customerEmail ${customerEmail} priceId ${priceId} and planType ${planType}`
                    );
                    resolve(subscription);
                })
                .catch(err => {
                    LOGGER.error(
                        `Stripe package creation failed for name ${name} token ${token} planPrice ${planPrice} customerEmail ${customerEmail} priceId ${priceId} and planType ${planType}`
                    );
                    reject({
                        message: err
                    });
                });
        } else {
            LOGGER.info(`Subscription plan is only for more than 0.00 price`);
            resolve();
        }
    });
};

// function to retake subscription
const retakeSubscription = (
    stripeCustomerId,
    priceId,
    paymentMethodId,
    planType
) => {
    return new Promise((resolve, reject) => {
        createStripeSubscription(
            stripeCustomerId,
            priceId,
            paymentMethodId,
            planType
        )
            .then(subscription => {
                payInvoice(subscription.latest_invoice);
                return subscription;
            })
            .then(subscription => {
                LOGGER.info(
                    `Retake Subscription done for customer ${stripeCustomerId} price ${priceId} payment method ${paymentMethodId} planType ${planType}`
                );
                resolve(subscription);
            })
            .catch(err => {
                LOGGER.error(
                    `Retake Subscription failed for customer ${stripeCustomerId} price ${priceId} payment method ${paymentMethodId} planType ${planType}`
                );
                reject({
                    message: err
                });
            });
    });
};

// function to get customer wise all subscriptions
const getAllSubscription = customerId => {
    return new Promise((resolve, reject) => {
        stripe.subscriptions
            .list({
                customer: customerId.toString(),
                limit: 10
            })
            .then(subscriptions => {
                LOGGER.info(
                    `Retrieve all subscription for customer ${customerId} done`
                );
                resolve(subscriptions.data);
            })
            .catch(err => {
                LOGGER.error(
                    `Retrieve all subscription failed for customer ${customerId} done`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to cancel a specific subscription
const cancelSubscription = subscriptionId => {
    return new Promise((resolve, reject) => {
        stripe.subscriptions
            .del(subscriptionId.toString())
            .then(cancelledSubscription => {
                LOGGER.info(
                    `Subscription cancel successful for id ${subscriptionId}`
                );
                resolve(cancelledSubscription);
            })
            .catch(err => {
                LOGGER.error(
                    `Subscription cancel failed for id ${subscriptionId}`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to get customer wise all payment
const getAllPayments = customerId => {
    return new Promise((resolve, reject) => {
        stripe.invoices
            .list({
                customer: customerId.toString(),
                limit: 10
            })
            .then(payments => {
                LOGGER.info(`Get all payment for customer ${customerId} done`);
                resolve(payments.data);
            })
            .catch(err => {
                LOGGER.error(
                    `Get all payment for customer ${customerId} failed`
                );
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    });
};

// function to retrieve invoice
const retrieveInvoice = invoiceId => {
    return new Promise((resolve, reject) => {
        stripe.invoices
            .retrieve(invoiceId)
            .then(invoice => {
                LOGGER.info(`Retrieve invoice done for invoiceId ${invoiceId}`);
                resolve(invoice);
            })
            .catch(err => {
                LOGGER.error(
                    `Retrieve invoice failed for invoiceId ${invoiceId}`
                );
                reject({
                    message: `${err?.type} ${err}`
                });
            });
    });
};

// function to upgrade subscription Plan. this is for those those customer who already have stripeCustomer & Stripe subscriptionId
const upgradeSubscriberSubscription = (
    stripeCustomerId,
    stripeSubscriptionId,
    priceId,
    token
) => {
    return new Promise((resolve, reject) => {
        // paymentMethodId = token?.paymentMethodId;
        stripe.subscriptions
            .retrieve(stripeSubscriptionId)
            .then(subscription =>
                stripe.subscriptions.update(stripeSubscriptionId, {
                    cancel_at_period_end: false,
                    proration_behavior: 'create_prorations',
                    items: [
                        {
                            id: subscription.items.data[0].id,
                            price: priceId
                        }
                    ],
                    coupon: token?.promotionCode
                })
            )
            // .then(subscription => {
            //     const charge = payInvoice(subscription.latest_invoice);
            //     return Promise.all([subscription, charge]);
            // })
            .then(subscription => {
                LOGGER.info(
                    `subscription update done subscriptionId ${stripeSubscriptionId} customerId ${stripeCustomerId} price ${priceId} and token ${token}`
                );
                resolve(subscription);
            })
            .catch(err => {
                LOGGER.error(
                    `subscription update failed subscriptionId ${stripeSubscriptionId} customerId ${stripeCustomerId} price ${priceId} and token ${token}`
                );
                console.log('err', err);
                reject({
                    message: err?.message
                });
            });
    });
};

const handleStripePaymentTrigger = (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            CONFIG.STRIPEENDPOINTSECRET
        );
    } catch (err) {
        LOGGER.error(`Stripe payment trigger failed ${sig}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            let eventDataObject = event.data.object;
            authService
                .subscriptionTrigger(eventDataObject?.customer)
                .then(franchiseeId =>
                    generatePaymentHistory(franchiseeId, eventDataObject)
                )
                .then(() => res.send())
                .catch(err => {
                    LOGGER.error(`Stripe payment trigger failed ${err}`);
                    res.status(500).json({ status: 'fail', error: err });
                });
            // Then define and call a function to handle the event payment_intent.succeeded
            break;
        default:
            res.status(200).json({ status: 'success' });
    }
};

// function to generate payment history against stripe subscription
const generatePaymentHistory = (subscriberId, eventData) => {
    let historyObject = {
        subscriberId: subscriberId,
        paymentDate: new Date(eventData?.created * 1000),
        paymentIntentId: eventData?.id,
        amount: parseFloat(eventData?.amount) / 100
    };

    return (promise = new Promise((resolve, reject) => {
        retrieveInvoice(eventData?.invoice)
            .then(invoice => {
                historyObject['invoice'] = {
                    invoiceId: eventData?.invoice,
                    invoiceNo: invoice?.number,
                    invoiceDownloadURL: invoice?.invoice_pdf,
                    hostedInvoiceURL: invoice?.hosted_invoice_url
                };
                historyObject['chargeId'] = invoice?.charge;
                historyObject['status'] = invoice?.status;

                // retrieve stripe charge
                return stripe.charges.retrieve(invoice?.charge);
            })
            .then(charge => {
                historyObject['paymentMethod'] = {
                    last4Digit: charge?.payment_method_details?.card?.last4,
                    brand: charge?.payment_method_details?.card?.brand,
                    exp_month: charge?.payment_method_details?.card?.exp_month,
                    exp_year: charge?.payment_method_details?.card?.exp_year
                };

                // get subscriberConfig by subscriberId
                return SubscriberConfig.findOne(
                    { franchiseeId: subscriberId },
                    { subscriptionPlanId: 1 }
                );
            })
            .then(subscriberConfig => {
                historyObject['subscriptionPlanId'] =
                    subscriberConfig?.subscriptionPlanId;

                return SubscriptionHistory.findOne({
                    franchiseeId: subscriberId,
                    status: 'active'
                });
            })
            .then(subscriptionHistory => {
                historyObject['subscriptionHistoryId'] =
                    subscriptionHistory?._id;
                // insert payment history
                return PaymentHistory.create(historyObject);
            })
            .then(paymentHistory => resolve())
            .catch(err => {
                LOGGER.error(`Generate payment history failed ${err}`);
                reject({
                    message: `${err?.type} ${err}`
                });
            });
    }));
};

// Stripe Cupon section start
const getAllCouponFromStripe = async () => {
    return new Promise((resolve, reject) => {
        stripe.coupons
            .list({
                limit: 10,
            })
            .then(coupons => {
                LOGGER.info(`Get all coupons ${''} done`);
                resolve(coupons);
            })
            .catch(err => {
                LOGGER.info(`Get all coupons ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    })
}

const createCouponsInStripe = async (couponObject) => {
    return new Promise((resolve, reject) => {
        stripe.coupons
            .create(couponObject)
            .then(coupons => {
                LOGGER.info(`Save coupons ${''} done`);
                resolve(coupons);
            })
            .catch(err => {
                LOGGER.info(`Save coupons ${err?.type} ${err?.raw.message} failed`);
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    })
}

const updateCouponsInStripe = async (couponId, couponObj) => {
    const couponUpdateObj = {
        // percent_off: couponObj?.percent_off,
        // duration: couponObj?.duration,
        // duration_in_months: couponObj?.duration_in_months,
        name: couponObj?.name,
        metadata: couponObj?.metadata,
    }
    return new Promise((resolve, reject) => {
        stripe.coupons
            .update(couponId, couponUpdateObj)
            .then(coupons => {
                LOGGER.info(`Update coupon ${''} done`);
                resolve(coupons);
            })
            .catch(err => {
                LOGGER.info(`Update coupon ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw?.message}`
                });
            });
    })
}
// Stripe coupon section end

const getAllPromotionCodeFromStripe = async () => {
    return new Promise((resolve, reject) => {
        stripe.promotionCodes
            .list({
                limit: 10,
            })
            .then(promotionCodes => {
                LOGGER.info(`Get all promotion codes ${''} done`);
                resolve(promotionCodes);
            })
            .catch(err => {
                LOGGER.info(`Get all promotion codes ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    })
}

const createPromotionCodeInStripe = async (promotionObj) => {
    return new Promise((resolve, reject) => {
        stripe.promotionCodes
            .create(promotionObj)
            .then(promotionCodes => {
                LOGGER.info(`Save promotion codes ${''} done`);
                resolve(promotionCodes);
            })
            .catch(err => {
                LOGGER.info(`Save promotion codes ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                });
            });
    })
}

const updatePromotionCodeInStripe = async (couponId, couponObj) => {
    const couponUpdateObj = {
        // percent_off: couponObj?.percent_off,
        // duration: couponObj?.duration,
        // duration_in_months: couponObj?.duration_in_months,
        name: couponObj?.name,
        metadata: couponObj?.metadata,
    }
    return new Promise((resolve, reject) => {
        stripe.promotionCodes
            .update(couponId, couponUpdateObj)
            .then(promotionCodes => {
                LOGGER.info(`Update promotion codes ${''} done`);
                resolve(promotionCodes);
            })
            .catch(err => {
                LOGGER.info(`Update promotion codes ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw?.message}`
                });
            });
    })
}

const retrivePromotionCodeInStripe = async (promotionCodeId) => {
    return new Promise((resolve, reject) => {
        stripe.promotionCodes
            .retrieve(promotionCodeId)
            .then(promotionCodes => {
                LOGGER.info(`Update promotion codes ${''} done`);
                resolve(promotionCodes);
            })
            .catch(err => {
                LOGGER.info(`Update promotion codes ${''} failed`);
                reject({
                    message: `${err?.type} ${err?.raw?.message}`
                });
            });
    })
}

const deletePromotionCodeInStripe = async (couponId) => {
    return new Promise((resolve, reject) => {
        stripe.coupons
            .del(couponId)
            .then(promotionCodes => {
                LOGGER.info(`Delete promotion codes ${''} done`);
                resolve(promotionCodes);
            })
            .catch(err => {
                LOGGER.info(`Delete promotion codes ${''} failed: ${err}`);
                reject({
                    message: `${err}`
                });
            });
    })
}

module.exports = {
    createStripePackages,
    retakeSubscription,
    createPaymentMethod,
    attachedPaymentMethodWithCustomer,
    setSubscriptionDefaultPaymentMethod,
    retrievePaymentMethod,
    getCustomerWisePaymentMethods,
    getAllSubscription,
    cancelSubscription,
    getAllPayments,
    retrieveInvoice,
    upgradeSubscriberSubscription,
    payInvoice,
    handleStripePaymentTrigger,
    getAllCouponFromStripe,
    createCouponsInStripe,
    updateCouponsInStripe,
    getAllPromotionCodeFromStripe,
    createPromotionCodeInStripe,
    updatePromotionCodeInStripe,
    retrivePromotionCodeInStripe,
    deletePromotionCodeInStripe
};
