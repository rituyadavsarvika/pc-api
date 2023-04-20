const express = require('express');
const router = express.Router();

// Load Middleware
const authMiddleware = require('./../../../middlewares/auth/authMiddleware');
const franchiseeMiddleware = require('./../../../middlewares/franchisee/franchiseeMiddleware');
const chatConfigMiddleware = require('./../../../middlewares/config/chatConfigMiddleware');

// load Controller
const Controller = require('./../../../controllers/v2/config/chatConfigController');

/**
 * @swagger
 * /v2/chatConfig?adminType=&franchiseeId=&limit=1 :
 *   get:
 *     summary: This route is responsible for getting Chat Config by Id.
 *     description: This route is responsible for getting Chat Config by Id.
 *     
 *     tags:
 *       - Get Chat
 *     responses:
 *       200:
 *         description: chatConfig.
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
 *                         description: Chat ID.
 *                         example: 0
 *                       franchiseeId:
 *                         type: objectId
 *                         description: Franchisee ID.
 *                       chats:
 *                         type: array
 *                         description: Chat List.
 * 
 * 
 */

/**
* @swagger
*  /v2/chatConfig:
*    post:
*      summary: Creates a new Chat.
*      consumes:
*        - application/json
*      tags:
*        - Create a new Chat
*      parameters:
*        - in: body
*          name: Chat Config
*          description: Create Chat Config
*          schema:
*            type: object
*            required:
*              - adminType
*              - franchiseeId
*              - chats
*            properties:
*              adminType:
*                type: string
*              franchiseeId:
*                type: string
*              chats:
*                type: Array
*      responses:
*        201:
*          description: New chat created!
*/


router
    .route('/')
    .get(Controller.getAllChatConfig)
    .post(
        [
            authMiddleware.protectRoute,
            franchiseeMiddleware.checkAdminTypeFranchiseeId,
            chatConfigMiddleware.checkIsMultiple
        ],
        Controller.createChatConfigMany
    )


// /**
// * @swagger
// *  /v2/chatConfig:
// *    patch:
// *      summary: update Chat.
// *      consumes:
// *        - application/json
// *      tags:
// *        - Update a Chat
// *      parameters:
// *        - in: body
// *          name: Chat Config
// *          description: Create Chat Config
// *          schema:
// *            type: object
// *            required:
// *              - adminType
// *              - franchiseeId
// *              - chats
// *            properties:
// *              adminType:
// *                type: string
// *              franchiseeId:
// *                type: string
// *              chats:
// *                type: Array
// *      responses:
// *        201:
// *          description: New chat created!
// */
router
    .route('/:id')
    .get(Controller.getChatConfig)
    .patch([
        authMiddleware.protectRoute, 
        authMiddleware.isSuperOrCityAdminUser
    ], Controller.updateChatConfigMany);

module.exports = router;
