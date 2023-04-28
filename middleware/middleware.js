const JsonWebToken = require("jsonwebtoken")
const UserModel = require("../models/user.model")
const { isEmpty } = require("../utils/functions")
const multer = require("multer")
const path = require('path')
const { upload_files_constants } = require("../utils/constants")


//middleware for check token validy, if true return user's id else throw errors
exports.authenticate = async (req, res, next) => {
    try {
        let token = req.header("token")

        if (isEmpty(token))
            throw ""


        const data = JsonWebToken.verify(token, process.env.JWT_SECRET)

        if ((req.body.hostID && req.body.hostID !== data.id) || (req.params.hostID && req.params.hostID !== data.id)) {
            throw "Désolé, vous n'êtes la personne autorisée à effectuer cette action !"
        }

        if (isEmpty(data.id))
            throw "Delais d'authentification expiré"

        const user = await UserModel.findById(data.id)
        if (isEmpty(user)) throw "Echec d'authentification"

        req.id = user
        next()
    } catch (error) {
        res.status(401).json({ message: error })
    }
}

//middleware for upload files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let destFolder = ''
        if (file.mimetype.startsWith('image/')) {
            destFolder = `${__dirname}/../public/images`
        } else if (file.mimetype.startsWith('video/')) {
            destFolder = `${__dirname}/../public/videos`
        }

        cb(null, destFolder)
    },
    filename: function (req, file, cb) {
        let name = ''
        if (file.mimetype.startsWith('image/')) {
            name = 'image' + '-' + Date.now() + path.extname(file.originalname)
        } else if (file.mimetype.startsWith('video/')) {
            name = 'video' + '-' + Date.now() + path.extname(file.originalname)
        }

        cb(null, name)
    }
})

const fileFilter = (req, file, cb) => {
    if (!upload_files_constants.FILES_ALLOW_TYPES.includes(file.mimetype)) {
        return cb(new Error('Seuls les fichiers JPEG, PNG, MP4 et MOV sont autorisés'))
    }

    cb(null, true)
}

const limits = {
    fileSize: upload_files_constants.MAX_SIZE,
    files: upload_files_constants.MAX_FILES_TO_UPLOAD
}

exports.upload = multer({ storage, fileFilter, limits })

