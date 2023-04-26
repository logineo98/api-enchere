const { login, register, checking, profile, licenseActivation } = require('../controllers/auth.controller')
const { get_user, get_users, update_user, delete_user, send_invitation, forgot_password, confirm_forgot_recovery_code, reset_forgot_password, like_enchere } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/middleware');
const { login_validation, licenseActivation_validation, update_user_validation } = require('../utils/validations');

const router = require('express').Router()

router.get("/get/profile", authenticate, profile)
router.post("/checking", checking)
router.post("/login", login_validation, login)
router.post("/activation-license", authenticate, licenseActivation_validation, licenseActivation)
router.post("/forgot_password", forgot_password)
router.post("/confirm_forgot_recovery_code", authenticate, confirm_forgot_recovery_code)
router.post("/reset_forgot_password", authenticate, reset_forgot_password)

router.post("/", register);
router.get("/:id/:hostID", authenticate, get_user);
router.get("/:hostID", authenticate, get_users);
router.put("/:id/:hostID", update_user_validation, authenticate, update_user);
router.delete("/:id/:hostID", authenticate, delete_user);

router.patch("/send-invitation/:id/:hostID", authenticate, send_invitation)
router.patch("/like-enchere/:id/:hostID", authenticate, like_enchere)

module.exports = router