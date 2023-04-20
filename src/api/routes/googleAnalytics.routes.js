const express = require('express');
const router = express.Router();

// import middleware
const authMiddleware = require('../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../middlewares/franchisee/franchiseeMiddleware');
const googleAnalytics = require('./../middlewares/googleAnalytics.middleware');

// Load Controller
const Controller = require('./../controllers/googleAnalytics.controller');

/**
* @swagger
*  /v1/googleAnalytics:
*    post:
*      summary: Creates a new google analytics.
*      consumes:
*        - application/json
*      tags:
*        - Create a new google analytics
*      parameters:
*        - in: body
*          name: Google Analyttics
*          description: Create google analytics
*          schema:
*            type: object
*            required:
*              - adminType
*              - franchiseeId
*              - code
*              - active
*              - gtmCode
*              - gtmActive
*              - ga4Code
*              - ga4CodeActive
*            properties:
*              adminType:
*                type: string
*              franchiseeId:
*                type: string
*              code:
*                type: string
*              active:
*                type: string
*              gtmCode:
*                type: string
*              gtmActive:
*                type: string
*              ga4Code:
*                type: string
*              ga4CodeActive:
*                type: string
*      responses:
*        201:
*          description: New message created!
*/
router
	.route('/')
	.post(
		[
			authMiddleware.protectRoute,
			authMiddleware.isSuperOrCityAdminUser,
			franchiseeMiddleware.checkAdminTypeFranchiseeId,
			googleAnalytics.checkDuplicate
		],
		Controller.createNew
	)
	.get(Controller.getAll);

// route by id

/**
 * @swagger
 * /v1/googleAnalytics/:id :
 *   get:
 *     summary: This route is responsible for getting Google analytics by Id.
 *     description: This route is responsible for getting Google analytics by Id.
 *     responses:
 *       200:
 *         description: googleAnalytics.
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
router
	.route('/:id')
	.get(Controller.getById)
	.patch(authMiddleware.protectRoute, Controller.updateById);

module.exports = router;
