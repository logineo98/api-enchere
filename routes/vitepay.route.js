const { vitepay_callback } = require('../controllers/vitepay.controller')

const router = require('express').Router()

router.post("/callback", vitepay_callback)

module.exports = router