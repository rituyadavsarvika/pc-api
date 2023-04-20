const { Router } = require('express')

const router = Router()

// const routerV1 = require('./v1')
const routerV2 = require('./v2')

// router.use('/v1', routerV1)
router.use('/v2', routerV2)

module.exports = router