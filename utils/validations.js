const { isValidObjectId } = require("mongoose");
const { isEmpty } = require("./functions");
const UserModel = require("../models/user.model");
const { regex } = require("./constants");

exports.login_validation = async (req, res, next) => {
    try {
        let errors;
        const { phone, password } = req.body

        if (phone && !regex.phone.test(phone)) errors = "Format du numéro incorrect.";
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

exports.update_user_validation = async (req, res, next) => {
    try {
        let errors;
        const { email, phone, password } = req.body

        if (!isValidObjectId(req.params.id)) errors = "ID fourni est incorrect ou invalid.";

        const user = await UserModel.findById(req.params.id)

        if (isEmpty(user)) errors = "Cet utilisateur n'existe pas."
        if (isEmpty(email)) errors = "Veuillez renseigner un e-mail."
        if (isEmpty(phone)) errors = "Veuillez renseigner un numero de téléphone."
        if (password === "") errors = "Veuillez renseigner un mot de passe."
        else if (!isEmpty(password) && password.length < 6) errors = "Mot de passe trop court."

        req.error = errors
        next()
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.send_invitation_validation = (friend_phone) => {
    const initialError = { friend_phone: "" }
    let error = initialError
    regex

    if (!friend_phone || friend_phone.trim() === "") {
        error = { ...error, friend_phone: "Désolé, veuillez renseigner un numéro de téléphone !" }
    } else if (regex.phone.test(friend_phone.trim()) === false) {
        error = { ...error, friend_phone: "Désolé, le numéro de téléphone n'est pas de format valide !" }
    }

    return { error, initialError }
}