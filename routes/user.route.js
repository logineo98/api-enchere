const { login, register, checking, profile } = require('../controllers/auth.controller');
const { get_user, get_users, update_user, delete_user } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/middleware');
const { login_validation } = require('../utils/validations');

const router = require('express').Router();

router.get("/get/profile", authenticate, profile)
router.post("/checking", checking)
router.post("/login", login_validation, login);

router.post("/", register);
router.get("/:id", get_user);
router.get("/", get_users);
router.put("/:id", update_user);
router.delete(":id", delete_user);


module.exports = router