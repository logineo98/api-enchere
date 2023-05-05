const { isValidObjectId } = require("mongoose")
const { isEmpty } = require("./functions")
const UserModel = require("../models/user.model")
const { regex } = require("./constants")
const EnchereModel = require("../models/enchere.model")

//------------------------ USER ----------------------------------------------------------

exports.login_validation = async (req, res, next) => {
    try {
        let { email, phone, password, dashboard } = req.body

        //recuperation du type d'authentification selon qu'il soit par (e-mail,password ) ou par (phone,password)
        if (email) email = req.body.email.toLowerCase().trim();
        if (phone) phone = req.body.phone.trim();

        if (email === "" && phone === "") throw dashboard !== "" ? "Un nom d'utilisateur est requis." : "Un numero de téléphone est requis. 1"
        if (dashboard && dashboard !== "")
            if (email && !regex.email.test(email)) throw "Un nom d'utilisateur est requis.";
            else if (phone && !regex.phone.test(phone)) throw "Un nom d'utilisateur est requis.";

        if ((dashboard === "" || !dashboard || isEmpty(dashboard)) && phone && !regex.phone.test(phone)) throw "Format du numéro incorrect."
        if (dashboard === "" && (isEmpty(phone) || phone === "")) throw "Numéro ou mot de passe incorrect."
        if (isEmpty(password) || password === "") throw "Numéro ou mot de passe incorrect."
        if ((!isEmpty(password) || password !== "") && password.length < 6) throw "Mot de passe trop court."

        next()
    } catch (error) {
        console.log(error.message || error)
        res.status(500).json({ message: error })
    }
}

exports.update_user_validation = async (req, res, next) => {
    try {
        const { password, email } = req.body
        if (!isValidObjectId(req.params.id)) throw "ID fourni est incorrect ou invalide."
        console.log(req.body)
        const user = await UserModel.findById(req.params.id)

        if (isEmpty(user)) throw "Cet utilisateur n'existe pas."
        if (password === "") throw "Veuillez renseigner un mot de passe."
        else if (!isEmpty(password) && password.length < 6) throw "Mot de passe trop court."

        if (email === "") throw "Un email est requis."
        if (email && !regex.email.test(email?.trim())) throw "Format d'email incorrect."

        next()
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

exports.register_validation = (phone, password, password_confirm) => {
    const initialError = { phone: "", password: "", password_confirm: "" }
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
    } else if (password.trim() !== password_confirm.trim()) {
        error = { ...error, password_confirm: "Désolé, les deux mots de passe ne se correspondent pas!" }
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
        return { message: "Désolé, ce numéro de téléphone existe déjà !" }
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

//------------------------ ENCHERE ----------------------------------------------------------
exports.create_enchere_validation = async (req, res, next) => {
    try {

        let empty_error = { title: "", description: "", started_price: "", increase_price: "", categories: "", enchere_type: "" }
        let errors = empty_error

        let { hostID, title, description, started_price, increase_price, categories, expiration_time } = req.body

        if (hostID === "" || isEmpty(hostID)) throw "Identifiant utilisateur invalide ou incorrect."

        if (isEmpty(title)) errors = { ...errors, title: "Veuillez renseigner le titre de l'enchère." }
        if (isEmpty(description)) errors = { ...errors, description: "Veuillez renseigner la description de l'enchère." }

        if (isEmpty(expiration_time)) errors = { ...errors, description: "Veuillez renseigner la durée d'expiration de l'enchère" }

        if (isEmpty(started_price)) errors = { ...errors, started_price: "Veuillez renseigner le prix de depart de l'enchère." }
        else if (!isEmpty(started_price) && started_price < 500) errors = { ...errors, started_price: "Le prix de depart de l'enchère doit être superieur ou égale à 500 fcfa." }

        if (isEmpty(increase_price)) errors = { ...errors, increase_price: "Veuillez renseigner le prix d'incrementation de l'enchère." }
        else if (!isEmpty(increase_price) && increase_price < 500) errors = { ...errors, increase_price: "Le prix d'incrementation de l'enchère doit être superieur ou égale à 500 fcfa." }

        if (isEmpty(categories)) errors = { ...errors, categories: "Veuillez choisir au moins une categorie pour votre enchère." }

        if (errors !== empty_error) throw errors
        else next()
    } catch (error) {
        res.status(500).json({ message: error })
    }
}

exports.update_enchere_validation = async (req, res, next) => {
    try {
        let empty_error = { title: "", description: "", started_price: "", increase_price: "", categories: "", enchere_type: "" }
        let errors = empty_error

        let { title, description, started_price, increase_price, categories, expiration_time } = req.body

        if (isEmpty(req.params.id)) throw "Identifiant de l'enchère invalide ou incorrect."
        if (isEmpty(req.params.hostID)) throw "Identifiant utilisateur invalide ou incorrect."

        // const user = await UserModel.findById(req.params.hostID)
        const enchere = await EnchereModel.findById(req.params.id)

        // if (!isEmpty(user) && user.vip === true && enchere_type === "") errors = { ...errors, enchere_type: "Veuillez definire le type d'enchere pour votre enchère." }

        if (isEmpty(enchere)) throw "Désolé, aucune enchère correspondante n'a été trouvée."

        // if (!isEmpty(user) && user.vip === true && enchere_type !== "" && (enchere_type !== "public" && enchere_type !== "privée")) errors = { ...errors, enchere_type: "L'enchere est soit public ou privée." }
        if (title === "") errors = { ...errors, title: "Veuillez inserer le titre de l'enchère." }
        if (description === "") errors = { ...errors, description: "Veuillez inserer la description de l'enchère." }

        if (expiration_time === "") errors = { ...errors, description: "Veuillez inserer la durée de l'enchère" }

        if (started_price === "") errors = { ...errors, started_price: "Veuillez inserer le prix de demarage de l'enchère." }
        else if (!isEmpty(started_price) && started_price < 500) errors = { ...errors, started_price: "Le prix de demarage de l'enchère doit être superieur ou égale à 500 fcfa." }

        if (increase_price === "") errors = { ...errors, increase_price: "Veuillez inserer le prix d'incrementation de l'enchère." }
        if (categories === "" || categories === []) errors = { ...errors, categories: "Veuillez choisir au moins une categorie pour votre enchère." }

        if (errors !== empty_error) throw errors
        next()
    } catch (error) {
        res.status(500).json({ message: error })
    }

}