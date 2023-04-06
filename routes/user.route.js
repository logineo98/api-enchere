const { login, register, checking, profile, licenseActivation } = require('../controllers/auth.controller')
const { get_user, get_users, update_user, delete_user, send_invitation } = require('../controllers/user.controller')
const { authenticate } = require('../middleware/middleware')
const { login_validation, licenseActivation_validation } = require('../utils/validations')

const router = require('express').Router()

router.get("/get/profile", authenticate, profile)
router.post("/checking", checking)
router.post("/login", login_validation, login)
router.post("/activation-license", licenseActivation_validation, licenseActivation)

router.post("/", register)
router.get("/:id", get_user)
router.get("/", get_users)
router.put("/:id", update_user)
router.delete("/:id", delete_user)

router.patch("/send-invitation/:id", send_invitation)

module.exports = router