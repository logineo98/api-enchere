const { create_enchere, participate_in_enchere, get_enchere, get_all_encheres, update_enchere, delete_enchere } = require('../controllers/enchere.controller')
const { upload } = require('../middleware/middleware')
const { authenticate } = require('../middleware/middleware')
const { upload_files_constants } = require('../utils/constants')
const { create_enchere_validation, update_enchere_validation } = require('../utils/validations')

const router = require('express').Router()

router.post("/", upload.array('files', upload_files_constants.MAX_FILES_TO_UPLOAD), authenticate, create_enchere_validation, create_enchere)
router.get("/:id/:hostID", authenticate, get_enchere)
router.get("/:hostID", authenticate, get_all_encheres)
router.put("/:id/:hostID", upload.array('files', upload_files_constants.MAX_FILES_TO_UPLOAD), authenticate, update_enchere_validation, update_enchere)
router.delete("/:id/:hostID", authenticate, delete_enchere)

router.patch("/participate-in-enchere/:id/:hostID", authenticate, participate_in_enchere)


module.exports = router