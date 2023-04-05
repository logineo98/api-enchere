const { isValidObjectId } = require("mongoose");
const UserModel = require("../models/user.model");
const { isEmpty } = require("./functions");


exports.login_validation = async (req, res, next) => {
    try {
        let errors;
        const regexPhone = /(^(\+223|00223)?[5-9]{1}[0-9]{7}$)/;

        const { phone, password } = req.body

        if (phone && !regexPhone.test(phone)) errors = "Format du numéro incorrect.";
        if (isEmpty(phone)) errors = "Numéro ou mot de passe incorrect.";
        if (isEmpty(password)) errors = "Numéro ou mot de passe incorrect.";
        if (!isEmpty(password) && password.length < 6) errors = "Mot de passe trop court."

        req.error = errors;
        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

exports.licenseActivation_validation = async (req, res, next) => {
    try {
        let errors;
        const { userID, licenseKey } = req.body

        if (!isValidObjectId(userID)) errors = "ID fourni est incorrect ou invalid.";
        if (isEmpty(licenseKey)) errors = "Code non renseigner.";

        req.error = errors
        next()
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}