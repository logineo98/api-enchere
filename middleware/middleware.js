const JsonWebToken = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { isEmpty } = require("../utils/functions");



//middleware for check token validy, if true return user's id else throw errors
exports.authenticate = async (req, res, next) => {
    try {
        let token = req.header("token");

        if (isEmpty(token))
            return res.status(404).json({ message: "authentification impossible" });

        const data = JsonWebToken.verify(token, process.env.JWT_SECRET);

        if (isEmpty(data.id))
            res.status(404).json({ message: "code d'authentification expiré" });

        const user = await UserModel.findById(data.id);
        if (isEmpty(user)) res.status(401).json({ message: "echec d'authentification" });

        req.id = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Authentification requise." });
    }
};