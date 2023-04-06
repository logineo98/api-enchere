const { login, register, checking, profile, licenseActivation } = require('../controllers/auth.controller');
const { get_user, get_users, update_user, delete_user, send_invitation } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/middleware');
const { login_validation, licenseActivation_validation, update_user_validation } = require('../utils/validations');

const router = require('express').Router()

router.get("/get/profile", authenticate, profile)
router.post("/checking", checking)
router.post("/login", login_validation, login)
router.post("/activation-license", authenticate, licenseActivation_validation, licenseActivation)

router.post("/", authenticate, register);
router.get("/:id/:hostID", authenticate, get_user);
router.get("/:hostID", authenticate, get_users);
router.put("/:id/:hostID", update_user_validation, authenticate, update_user);
router.delete("/:id/:hostID", authenticate, delete_user);

router.patch("/send-invitation/:id/:hostID", authenticate, send_invitation)

module.exports = router