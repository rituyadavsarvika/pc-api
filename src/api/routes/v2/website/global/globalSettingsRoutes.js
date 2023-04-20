const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('../../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../../../middlewares/franchisee/franchiseeMiddleware');
const globalSettingsMiddleware = require('./../../../../middlewares/website/global/globalSettings.middleware');

// load Controller
const Controller = require('./../../../../controllers/v2/website/global/globalSettings.controller');
const expressBasicAuth = require('express-basic-auth');

router
    .route('/')
    .get(
        [
            expressBasicAuth({
                authorizer: authMiddleware.basicAuthorizer,
                unauthorizedResponse: authMiddleware.basicAuthorizerError
            })
        ], Controller.getAll
    )
    // .post(
    //     [
    //         authMiddleware.protectRoute,
    //         franchiseeMiddleware.checkAdminTypeFranchiseeId,
    //         globalSettingsMiddleware.checkIsMultiple
    //     ],
    //     Controller.createNew
    // )

router.use('/:id', globalSettingsMiddleware.checkValidId);

router
    .route('/:id')
    .get(Controller.getById)
// .patch([authMiddleware.protectRoute], Controller.updateById);

module.exports = router;
