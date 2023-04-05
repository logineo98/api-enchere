const { login, register } = require('../controllers/auth.controller');
const { get_user, get_users, update_user, delete_user } = require('../controllers/user.controller');

const router = require('express').Router();

router.post("/login", login);
router.post("/", register);
router.get("/:id", get_user);
router.get("/", get_users);
router.put("/:id", update_user);
router.delete(":id", delete_user);


module.exports = router