const JsonWebToken = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { isEmpty } = require("../utils/functions");
const multer = require("multer");



//middleware for check token validy, if true return user's id else throw errors
exports.authenticate = async (req, res, next) => {
    try {
        let token = req.header("token");

        if (isEmpty(token))
            throw "authentification impossible";


        const data = JsonWebToken.verify(token, process.env.JWT_SECRET);

        if ((req.body.hostID && req.body.hostID !== data.id) || (req.params.hostID && req.params.hostID !== data.id)) {
            throw "Désolé, vous n'êtes la personne autorisée à effectuer cette action !"
        }

        if (isEmpty(data.id))
            throw "Delais d'authentification expiré";

        const user = await UserModel.findById(data.id);
        if (isEmpty(user)) throw "Echec d'authentification";

        req.id = user;
        next();
    } catch (error) {
        res.status(401).json({ message: error });
    }
};


// configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1])
    }
})

// create multer instance with storage configuration
exports.upload = multer({ storage: storage });