const { login, register, checking, profile, licenseActivation } = require('../controllers/auth.controller')
const { get_user, get_users, update_user, delete_user, send_invitation, forgot_password, confirm_forgot_recovery_code, reset_forgot_password, getAllFirebaseToken } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/middleware');
const { login_validation, update_user_validation } = require('../utils/validations');

const router = require('express').Router()

router.get("/get/profile", authenticate, profile)
router.post("/checking", checking)
router.post("/login", login_validation, login)
router.post("/activation-license", authenticate, licenseActivation)
router.post("/forgot_password", forgot_password)
router.post("/confirm_forgot_recovery_code", confirm_forgot_recovery_code)
router.post("/reset_forgot_password", reset_forgot_password)

router.post("/", register);
router.get("/all-fb-token/:hostID", authenticate, getAllFirebaseToken)
router.get("/:id/:hostID", authenticate, get_user);
router.get("/:hostID", authenticate, get_users);
router.put("/:id/:hostID", authenticate, update_user_validation, update_user);
router.delete("/:id/:hostID", authenticate, delete_user);

router.patch("/send-invitation/:id/:hostID", authenticate, send_invitation)

module.exports = router