const { send_notification } = require('../controllers/notification.controller')

const router = require('express').Router()

router.post("/send-notification", send_notification)

module.exports = router