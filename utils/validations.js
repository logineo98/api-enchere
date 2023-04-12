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

exports.register_validation = (phone, password) => {
    const initialError = { phone: "", password: "" }
    let error = initialError

    // verifier si le numéro de téléphone est valide
    if (!phone || phone.trim() === "") {
        error = { ...error, phone: "Désolé, le numéro de téléphone est requis !" }
    } else if (regex.phone.test(phone.trim()) === false) {
        error = { ...error, phone: "Désolé, le numéro de téléphone n'est pas de format valide !" }
    }

    // verifier si le password est valide
    if (!password) {
        error = { ...error, password: "Désolé, le mot de passe est requis !" }
    } else if (password.trim().length < 6) {
        error = { ...error, password: "Désolé, le mot de passe doit être au moins 6 caractères !" }
    }

    return { error, initialError }
}

exports.register_error_validation = (error) => {
    const { errors, code, keyPattern } = error

    let infoError = { phone: "", password: "" }

    // pour le controle des erreurs sur le numéro de téléphone
    if (errors?.phone?.kind === "required") {
        infoError = { ...infoError, phone: "Désolé, le numéro de téléphone est requis !" }
    } else {
        infoError = { ...infoError, phone: "" }
    }

    // pour le controle des erreurs sur le mot de passe
    if (errors?.password?.kind === "required") {
        infoError = { ...infoError, password: "Désolé, le mot de passe est requis !" }
    } else if (errors?.password?.kind === "minlength") {
        infoError = { ...infoError, password: "Désolé, le mot de passe doit être au moins 6 caractères !" }
    } else {
        infoError = { ...infoError, password: "" }
    }

    if (code === 11000 && keyPattern.phone) {
        return { phone: "Désolé, ce numéro de téléphone existe déjà !" }
    }

    return infoError
}

exports.send_invitation_validation = (friend_phone) => {
    const initialError = { friend_phone: "" }
    let error = initialError

    if (!friend_phone || friend_phone.trim() === "") {
        error = { ...error, friend_phone: "Désolé, veuillez renseigner un numéro de téléphone !" }
    } else if (regex.phone.test(friend_phone.trim()) === false) {
        error = { ...error, friend_phone: "Désolé, le numéro de téléphone n'est pas de format valide !" }
    }

    return { error, initialError }
}