const compression = require('compression');
const express = require('express');
const cron = require('node-cron');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
var bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth')

const globalErrorController = require('./api/controllers/errors');
const AppError = require('./utils/error/appError');
const keys = require('../config/keys');
const { basicAuthorizer } = require('./api/middlewares/auth/authMiddleware');
const RequestTrackingModel = require('./models/requestTrackingModel');
const mongoose = require('mongoose');

const app = express();

const stripeService = require('./../service/stripeService');
app.post(
    '/handleStripePaymentTrigger',
    bodyParser.raw({ type: '*/*' }),
    stripeService.handleStripePaymentTrigger
);

app.use(cors());

app.get('/', (req, res, next) => {
    res.status(200).json({
        status: 'success',
        message: 'Hello World From app.js'
    });
});

// Middleware
app.use(compression());
app.use(helmet());

app.use(
    bodyParser.json({
        limit: '500mb'
    })
);
app.use(
    bodyParser.urlencoded({
        limit: '500mb',
        extended: true
    })
);

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ********** Cron section **********
// make blog post dynamically publish
const BlogService = require('./../service/blogService');
// This schedule will run every 5 minutes to publish all previous unpublished post
cron.schedule('*/30 * * * *', function () {
    BlogService.makePublish();
});

// dynamically update status to SUBSCRIPTION_EXPIRED and active false in user document and unset subscriptionExpireAt
const authService = require('./../service/authService');
// This schedule will run everyday at 12:00 AM
cron.schedule('0 0 0 * * *', function () {
    authService.makeSubscriptionExpired();
});

// dynamically create db backup at every 6 hours
const DBBackupService = require('./../service/dbBackup');
cron.schedule('0 */6 * * *', function () {
    DBBackupService.dbAutoBackUp();
});

const FranchiseeService = require('../service/franchiseeService');
// This schedule will run everyday 1 minute
cron.schedule('*/30 * * * *', async () => {
    console.log('running a task every 30 minutes');
    const franchiseeList = await FranchiseeService.checkDomainIsExist()

    // franchiseeList?.map(async (item, index) => {
    //     const domainHandler = await domainExistanceHandler(item?.domain)
    // })
    // console.log("franchiseeList:::", franchiseeList);
});

app.use((req, res, next) => {
    // Middleware to Bind request time to request object
    req.requestedTime = new Date().toISOString();
    next();
});

// app.use(function (req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header(
//         'Access-Control-Allow-Methods',
//         'GET,PUT,POST,PATCH,DELETE,OPTIONS'
//     );
//     res.header(
//         'Access-Control-Allow-Headers',
//         'Content-Type, Authorization, Content-Length, X-Requested-With, X-Api-Key'
//     );
//     res.header('Access-Control-Allow-Credentials', 'true');
//     if ('OPTIONS' === req.method) {
//         res.sendStatus(200);
//     } else {
//         next();
//     }
// });

// get Router
// ********** Operation router **********
const userRouter = require('./api/routes/auth/usersRouts');
const verifyToken = require('./api/routes/auth/tokenRoutes');
const verifyAccount = require('./api/routes/auth/accountVerifyRoutes');
const vendorCategoryRouter = require('./api/routes/franchisee/business/vendorCategoryRoutes');
const vendorRouter = require('./api/routes/franchisee/business/vendorRoutes');
const franchiseeRouter = require('./api/routes/franchisee/franchiseeRoutes');
const customerRouter = require('./api/routes/franchisee/customer/customerRoutes');

// ********* Integration router **********
const serviceIntegrationRoute = require('./api/routes/franchisee/integration/serviceIntegrationRoutes');

// ********* Subscription router **********
const subscriptionAttributeRoute = require('./api/routes/franchisee/payment/subscriptionAttributeRoutes');
const subscriptionPlanRoute = require('./api/routes/franchisee/payment/subscriptionPlanRoutes');
const subscriptionRoute = require('./api/routes/franchisee/payment/subscriptionRoutes');

// ********* Product router **********
// const categoryRoute = require('./api/routes/franchisee/categoryRoutes');
// const productRoute = require('./api/routes/franchisee/business/productRoute');
// const greetingCardRoute = require('./api/routes/franchisee/business/greetingCard.routes');
// const productCommentRoute = require('./api/routes/franchisee/business/productCommentRoute');
// const couponRoute = require('./api/routes/franchisee/coupon.route');
// const orderRoute = require('./api/routes/franchisee/orderRoutes');
// const businessOrderRoute = require('./api/routes/franchisee/business/businessOrderRoutes');
const paymentRoute = require('./api/routes/franchisee/payment/paymentRoutes');
// const sslcommerzRoute = require('./api/routes/franchisee/payment/sslcommerzRoutes');
// const ShippingMethodRouter = require('./api/routes/franchisee/business/shippingMethodRoutes');

// ********** website related router **********
const pageRouter = require('./api/routes/website/pageRoutes');
const pageBuilderRouter = require('./api/routes/website/pageBuilder.routes');
const globalSettingsRouter = require('./api/routes/website/global/globalSettings.routes');
const formRouter = require('./api/routes/formRoutes');
const menuRouter = require('./api/routes/website/menuRoute');
const headerRouter = require('./api/routes/website/headerRoutes');
const footerRouter = require('./api/routes/website/footerRoutes');
const navbarRouter = require('./api/routes/website/navbarRoutes');
const tagRouter = require('./api/routes/website/tagRoutes');
const blogRouter = require('./api/routes/website/blogRoutes');
const blogCommentRouter = require('./api/routes/website/blogCommentRoutes');
const shopRouter = require('./api/routes/website/shop.routes');

// ********** Configuration related router **********
const googleAnalyticsRouter = require('./api/routes/googleAnalytics.routes');
const outgoingMailConfigRouter = require('./api/routes/outgoingMailConfigRoutes');
const googleSearchConsoleRoute = require('./api/routes/config/googleSearchConsole.routes');
const pinterestVerificationRoute = require('./api/routes/config/pinterestVerification.routes');
const subscriberConfigRoute = require('./api/routes/config/subscriberConfig.routes');
const googleAdSenseRoute = require('./api/routes/config/googleAdSenseRoutes');
const metaConfigRoutes = require('./api/routes/config/metaConfigRoutes');
const chatConfig = require('./api/routes/config/chatConfigRoutes');
const chatConfigRouter = require('./api/routes/franchisee/chatConfigRoutes');

// ********** Media **********
const mediaContentRoute = require('./api/routes/media/mediaContent.routes');

// // API V2 IMPORTS
// const v2metaConfigRoutes = require('./api/routes/v2/config/metaConfigRoutes');
// const v2chatConfig = require('./api/routes/v2/config/chatConfigRoutes');


const { domainExistanceHandler } = require('./utils/helper');

const request = [];
//         originalUrl: String,
//         clientIp: String,
//         method: String,
//         osInfo: String,
//         userAgent: String,
//         requestedTime: Date,
// secChUaPlatform

const getRequestCountForApi = (req, res, next) => {
    // console.log("req:::", req.ip);
    // console.log("req:::", req);
    let osInfo = req?.headers['sec-ch-ua-platform'] ? 
        JSON.parse(req?.headers['sec-ch-ua-platform'])
        : null

    if (!request.length) {
        request.push({
            clientIp: req?.headers['x-forwarded-for'] || null,
            userAgent: req?.headers['user-agent'] || null,
            osInfo,
            originalUrl: req?.originalUrl,
            requestedTime: req?.requestedTime,
            method: req?.method,
            ip: req?.ip,
            count: 1
        })
    }
    else {
        let found = false;
        request.map((data, index) => {
            if (data.originalUrl == req?.originalUrl) {
                data.clientIp = req?.headers['x-forwarded-for'] || null
                data.userAgent = req?.headers['user-agent'] || null
                data.osInfo = osInfo
                data.originalUrl = req?.originalUrl
                data.requestedTime = req?.requestedTime
                data.method = req?.method
                data.ip = req?.ip
                data.count += 1;
                found = true;
            }

            if (index + 1 == request.length && found == false) {
                request.push({
                    clientIp: req?.headers['x-forwarded-for'] || null,
                    userAgent: req?.headers['user-agent'] || null,
                    osInfo,
                    originalUrl: req?.originalUrl,
                    requestedTime: req?.requestedTime,
                    method: req?.method,
                    ip: req?.ip,
                    count: 1,
                })
            }
        })
    }

    RequestTrackingModel.create(
        request[request?.length == 0 ? 0 : (request?.length - 1)]
    );

    next()
}


// app.use(basicAuth( { authorizer: myAuthorizer } ))
app.use(getRequestCountForApi);

// function myAuthorizer(username, password) {
//     console.log("username, password:::", username, password);
//     const userMatches = basicAuth.safeCompare(username, keys.BASIC_AUTH_USERNAME)
//     const passwordMatches = basicAuth.safeCompare(password, keys.BASIC_AUTH_PASSWORD)

//     return userMatches & passwordMatches
// }

app.use('/get-api-request-count', (req, res) => {
    res.send(request)
})

//swagger api
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");


// Extended: https://swagger.io/specification/#infoObject
const swaggerOptions = {
    swaggerDefinition: {
        info: {
            version: "1.0.0",
            title: "Prolific Cloud",
            description: "Prolific Cloud API Information",
            contact: {
                name: "Backend Team"
            },
            servers: ["http://localhost:3530"]
        }
    },
    // ['.routes/*.js']
    apis: ['./src/api/routes/*.js', './src/api/routes/franchisee/*.js']
};

const swaggerOptionsV2 = {
    swaggerDefinition: {
        info: {
            version: "2.0.0",
            title: "Prolific Cloud",
            description: "Prolific Cloud API Documentation",
            contact: {
                name: "Backend Team"
            },
            servers: ["http://localhost:3530"]
        }
    },
    // ['.routes/*.js']
    apis: ['./src/api/routes/v2/*.js', './src/api/routes/v2/config/*.js']
};

var options = {
    explorer: true,
    swaggerOptions: {
        requestInterceptor: function (request) {
            request.headers.Origin = `*`;
            return request;
        },
        enableCORS: false,
        urls: [
            {
                url: 'http://petstore.swagger.io/v2/swagger.json',
                name: 'Spec1'
            },
            {
                url: 'http://petstore.swagger.io/v2/swagger.json',
                name: 'Spec2'
            }
        ]
    }
}


// const swaggerDocs = swaggerJsDoc(swaggerOptions);
// app.use("/api-docs/v1", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const swaggerDocsV2 = swaggerJsDoc(swaggerOptionsV2);
app.use("/api-docs/v2", swaggerUi.serve, swaggerUi.setup(swaggerDocsV2));

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));

// const swaggerDocumentOne = require('./swagger-one.json');
// const swaggerDocumentTwo = require('./swagger-two.json');

// var options = {}

// app.use('/api-docs-one', swaggerUi.serveFiles(swaggerDocumentOne, options), swaggerUi.setup(swaggerDocumentOne));

// app.use('/api-docs-two', swaggerUi.serveFiles(swaggerDocumentTwo, options), swaggerUi.setup(swaggerDocumentTwo));



// Set routes
// ********** operation routes **********
app.use('/v1/users', userRouter);
app.use('/v1/tokens', verifyToken);
app.use('/v1/auth/verification', verifyAccount);
app.use('/v1/vendorCategories', vendorCategoryRouter);
app.use('/v1/vendors', vendorRouter);
app.use('/v1/franchisees', franchiseeRouter);
app.use('/v1/customers', customerRouter);

// ********* Integration router **********
app.use('/v1/services', serviceIntegrationRoute);

// ********* subscription router **********
app.use('/v1/subscriptionAttributes', subscriptionAttributeRoute);
app.use('/v1/subscriptionPlans', subscriptionPlanRoute);
app.use('/v1/subscriptions', subscriptionRoute);

// ********* Product router **********
// app.use('/v1/categories', categoryRoute);
// app.use('/v1/products', productRoute);
// app.use('/v1/greetingCards', greetingCardRoute);
// app.use('/v1/productComments', productCommentRoute);
// app.use('/v1/coupons', couponRoute);
// app.use('/v1/orders', orderRoute);
// app.use('/v1/businessOrders', businessOrderRoute);
app.use('/v1/payments', paymentRoute);
// app.use('/v1/sslcommerzInitiate', sslcommerzRoute);
// app.use('/v1/shippingMethods', ShippingMethodRouter);

// ********** website related routes **********
app.use('/v1/globalSettings', globalSettingsRouter);
app.use('/v1/form', formRouter);
app.use('/v1/pages', pageRouter);
app.use('/v1/pageBuilder', pageBuilderRouter);
app.use('/v1/menus', menuRouter);
app.use('/v1/headers', headerRouter);
app.use('/v1/footers', footerRouter);
app.use('/v1/navbars', navbarRouter);
app.use('/v1/tags', tagRouter);
app.use('/v1/posts', blogRouter);
app.use('/v1/blogComments', blogCommentRouter);
app.use('/v1/shops', shopRouter);

// ********** Configuration related routes **********
app.use('/v1/googleAnalytics', googleAnalyticsRouter);
app.use('/v1/mail-settings', outgoingMailConfigRouter);
// app.use('/v1/chatConfig', chatConfigRouter);
app.use('/v1/googleSearchConsole', googleSearchConsoleRoute);
app.use('/v1/pinterestVerification', pinterestVerificationRoute);
app.use('/v1/subscriberConfig', subscriberConfigRoute);
app.use('/api/v1/googleAdSense', googleAdSenseRoute);


// ********** Media **********
app.use('/v1/mediaContent', mediaContentRoute);


// app.use(function (req, res, next) {
//     req.version = req.headers['accept-version'];
//     console.log(req.version);
//     next();
// });

// //version path defined

// app.use('/api', versionRoutes({
//     "1.0.0": respondV1,
//     "2.0.0": respondV2
// }));

// function respondV1(req, res, next) {
//     app.use('/api', routeV1);
//     next();
// }
// function respondV2(req, res, next) {
//     app.use('/api', routeV2);
//     next();
// }

// API V2 START
const routes = require('./api/routes');


app.use('/api', routes)

// API V2 END

// send response to undefined routes
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorController);

module.exports = app;
