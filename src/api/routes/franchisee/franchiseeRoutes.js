const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../middlewares/franchisee/franchiseeMiddleware');
const emailRoleMiddleware = require('./../../../api/middlewares/emailRole.middleware');
const vendorMiddleware = require('./../../../api/middlewares/franchisee/business/vendorMiddleware');
const subscriptionPlanMiddleware = require('./../../middlewares/franchisee/payment/subscriptionPlanMiddleware');

// import controller
const Controller = require('../../controllers/franchisee/franchiseeController');
const { checkDomainIsExist } = require('../../../../service/franchiseeService');
const expressBasicAuth = require('express-basic-auth');

// @route endpoint api/v1/franchisee/check_domain_is_exist
router.route('/check_domain_is_exist').get(checkDomainIsExist);

// @router POST api/v1/franchisee/signup
router
    .route('/signup')
    .post(
        [
            expressBasicAuth({
                authorizer: authMiddleware.basicAuthorizer,
                unauthorizedResponse: authMiddleware.basicAuthorizerError
            }),
            emailRoleMiddleware.checkDuplicateEmail,
            franchiseeMiddleware.checkDuplicateEmail,
            vendorMiddleware.checkDuplicateEmail,
            franchiseeMiddleware.generateSlug,
            franchiseeMiddleware.setSlugField,
            subscriptionPlanMiddleware.getFreePlan,
            subscriptionPlanMiddleware.isValidId,
            subscriptionPlanMiddleware.CheckIfStripeConnected
        ],
        Controller.registerFranchisee
    );

/**
* @swagger
*  /v1/franchisees/create:
*    post:
*      summary: Creates a new franchisees.
*      consumes:
*        - application/json
*      tags:
*        - Create a new franchisees
*      parameters:
*        - in: body
*          name: franchisees
*          description: The franchisees to create.
*          schema:
*            type: object
*            required:
*              - name
*              - email
*              - address
*              - phone
*              - domainKey
*              - domainSlug
*              - generatedDomain
*              - domain
*              - image
*              - industryType
*            properties:
*              name:
*                type: string
*              email:
*                type: string
*              address:
*                type: string
*              phone:
*                type: string
*              domainKey:
*                type: string
*              domainSlug:
*                type: string
*              generatedDomain:
*                type: string
*              domain:
*                type: string
*              image:
*                type: string
*              industryType:
*                type: string
*      responses:
*        201:
*          description: New message created!
*/
router
    .route('/create')
    .post(
        [
            vendorMiddleware.checkDuplicateEmail,
            franchiseeMiddleware.generateSlug,
            franchiseeMiddleware.setSlugField,
            subscriptionPlanMiddleware.getFreePlan,
            subscriptionPlanMiddleware.isValidId,
            subscriptionPlanMiddleware.CheckIfStripeConnected
        ],
        Controller.createFranchisee
    );


// @route endpoint api/v1/franchisee
router.route('/').get(Controller.getAllFranchisees);

/**
* @swagger
* /v1/franchisees/by-email:
*   get:
*     summary: This route is responsible for getting all website by email.
*     description: This api is responsiable for getting all website by email.
*     responses:
*       200:
*         description: A list of franchisees.
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 data:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       id:
*                         type: integer
*                         description: The user ID.
*                         example: 0
*                       name:
*                         type: string
*                         description: The user's name.
*                         example: Leanne Graham
*/
router.route('/by-email').get(
    [authMiddleware.protectRoute],
    Controller.getFranchiseeByEmail
);


// route to get franchisee by domain
router
    .route('/store_name/:domain')
    .get(
        [
            expressBasicAuth({
                authorizer: authMiddleware.basicAuthorizer,
                unauthorizedResponse: authMiddleware.basicAuthorizerError
            })
        ], Controller.getByDomain
    );

//delete franchisee from user profile

/**
* @swagger
* /v1/franchisees/remove-franchisee/{id}:
*   get:
*     summary: Remove website.
*     description: This api is responsiable for removing website.
*     parameters:
*       - in: path
*         name: franchiseeId
*     responses:
*       200:
*         description: Remove franchisees
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 data:
*                   type: array
*                   items:
*                     type: object
*                     properties:
*                       id:
*                         type: integer
*                         description: The user ID.
*                         example: 0
*                       name:
*                         type: string
*                         description: The user's name.
*                         example: Leanne Graham
*/
router.route('/remove-franchisee/:id').get(
    [authMiddleware.protectRoute],
    Controller.deleteFranchisee
);

// Middleware to check valid id
router.use('/:id', franchiseeMiddleware.checkValidId);

// @route endpoint api/v1/franchisee/:id
router
    .route('/:id')
    .get(Controller.getFranchisee)
    .patch(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkDuplicateEmail,
            // franchiseeMiddleware.generateSlug,
            franchiseeMiddleware.setSlugField,
            franchiseeMiddleware.updateSubscriberConfig
        ],
        Controller.updateFranchisee
    );
module.exports = router;
