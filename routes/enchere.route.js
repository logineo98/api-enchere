const { create_enchere, participate_in_enchere, get_enchere, get_all_encheres, update_enchere, delete_enchere, upload_files, get_enchere_history, reject_enchere } = require('../controllers/enchere.controller')
const { authenticate } = require('../middleware/middleware')
const { create_enchere_validation, update_enchere_validation } = require('../utils/validations')

const router = require('express').Router()

router.post("/", authenticate, create_enchere_validation, create_enchere)
router.get("/:id/:hostID", authenticate, get_enchere)
router.get("/:hostID", authenticate, get_all_encheres)
router.put("/:id/:hostID", authenticate,update_enchere_validation, update_enchere)
router.delete("/:id/:hostID", authenticate, delete_enchere)

router.patch("/participate-in-enchere/:id/:hostID", authenticate, participate_in_enchere)
router.put("/reject-enchere/:id/:hostID", authenticate, reject_enchere)

router.post("/upload-file", upload_files)


module.exports = router