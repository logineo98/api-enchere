const { create_enchere, participate_in_enchere, get_enchere, get_all_encheres, update_enchere, delete_enchere } = require('../controllers/enchere.controller')
const { authenticate } = require('../middleware/middleware')

const router = require('express').Router()

router.post("/", authenticate, create_enchere)
router.post("/participate-in-enchere", authenticate, participate_in_enchere)
router.get("/:id/:hostID", authenticate, get_enchere)
router.get("/:hostID", authenticate, get_all_encheres)
router.put("/:id/:hostID", authenticate, update_enchere)
router.delete("/:id/:hostID", authenticate, delete_enchere)

module.exports = router