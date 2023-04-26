const { isValidObjectId } = require("mongoose")
const UserModel = require("../models/user.model")
const { send_invitation_validation } = require("../utils/validations")
const { isEmpty, genRandomNums, sendSMS, isEqual } = require("../utils/functions")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const EnchereModel = require("../models/enchere.model")

//--------- @return "user's data" and "success message" ----------------
//update user's info and password if exist
exports.update_user = async (req, res) => {
    try {
        const error = req.error
        if (!isEmpty(error)) return res.status(401).send({ message: error })

        if (!isEmpty(req.body.password)) {
            const salt = await bcrypt.genSalt(10)
            req.body.password = await bcrypt.hash(req.body.password, salt)
        }

        const user = await UserModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
        if (isEmpty(user)) return res.status(401).json({ message: "Mise à jour de cet utilisateur impossible" })

        res.status(200).json({ response: user, message: "Informations de l'utilisateur mise à jour." })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

//------------ @return finding "user's data" and "success message" -----------------
//retrieve user's datas by his ID
exports.get_user = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password")
        if (isEmpty(user)) return res.status(401).json({ message: "Cet utilisateur n'existe pas" })

        res.status(401).json({ response: user, message: "Utilisateur recuperer avec succès" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

//------------ @return an "Array of users" and "success message" -----------------
//retrieve users datas
exports.get_users = async (req, res) => {
    try {
        const user = await UserModel.find().sort({ createdAt: -1 }).select("-password")

        res.status(401).json({ response: user, message: "" })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

//------------ @return "user's datas" and "success message" -----------------
//verify if user id exist then delete that user else we throw errors
exports.delete_user = async (req, res) => {
    try {
        if (isEmpty(req.params.id) || !isValidObjectId(req.params.id)) throw "Identifiant utilisateur invalide ou incorrect."

        const user = await UserModel.findByIdAndDelete(req.params.id)
        if (isEmpty(user)) throw "Echec de suppression"

        res.status(200).json({ response: user, message: "Utilisateur supprimé avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

exports.send_invitation = (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Désolé l'identifiant de l'utilisateur n'est pas correct !" })
    }

    const { friend_phone } = req.body

    const { error, initialError } = send_invitation_validation(friend_phone)

    if (error !== initialError) {
        return res.status(400).json({ message: error })
    } else {
        UserModel.findOne({ phone: friend_phone })
            .then(user => {
                // ici on verifiera si le numero d'invitation existe deja il sera transformé en vip
                if (user) {
                    user.updateOne({ $set: { vip: true } }, { new: true })
                        .then(() => {
                            UserModel.findByIdAndUpdate(req.params.id, { $addToSet: { invitations: friend_phone } }, { new: true })
                                .then(user => {
                                    sendSMS("0022379364385", "0022379364385", "Lien de Play Store")
                                        .then(sms => {
                                            res.send({ response: user, message: "L'invitation a bien été envoyé !", sms })
                                        })
                                        .catch((error) => res.status(500).json({ message: error.message }))
                                })
                                .catch(error => res.status(500).json({ message: error.message }))
                        })
                        .catch(error => res.status(500).json({ message: error.message }))
                } else {
                    // sinon l'expediteur conservera juste le numero d'invitation dans sa liste d'invitation
                    UserModel.findByIdAndUpdate(req.params.id, { $addToSet: { invitations: friend_phone } }, { new: true })
                        .then(user => {
                            sendSMS("0022379364385", "0022379364385", "Lien de Play Store")
                                .then(sms => {
                                    res.send({ response: user, message: "L'invitation a bien été envoyé !", sms })
                                })
                                .catch((error) => res.status(500).json({ message: error.message }))
                        })
                        .catch(error => res.status(500).json({ message: error.message }))
                }
            })
            .catch(error => res.status(500).json({ message: error.message }))
    }
}

exports.like_enchere = async (req, res) => {
    try {
        const { enchere_id } = req.body

        if (!isValidObjectId(req.params.id) || !isValidObjectId(enchere_id)) {
            return res.status(400).json({ message: "Désolé l'identifiant de l'utilisateur ou de l'enchère n'est pas correct !" })
        }

        const user_after_update = await UserModel.findByIdAndUpdate(req.params.id, { $addToSet: { likes: enchere_id } }, { new: true })
        if (!user_after_update) throw "Désolé une erreur est survenue au niveau du serveur lors du like de l'enchère."

        res.send({ response: user_after_update, message: "Enchère ajoutée aux favoris avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

exports.forgot_password = async (req, res) => {
    try {
        const { plateforme, phone } = req.body

        const user = await UserModel.findOne({ phone })
        if (isEmpty(user)) throw "Ce numero n'existe pas"

        if (plateforme === "android") {

            const token = genRandomNums(4)

            const payload = { token }
            const options = { expiresIn: 15 * 60 }


            const forgot_password_token = jwt.sign(payload, process.env.JWT_SECRET, options)
            const updated = await UserModel.findOneAndUpdate(user?._id, { $set: { forgot_password_token } }, { new: true, upsert: true })

            if (isEmpty(updated)) throw "Erreur de reinitialisation du mot de passe"


            // let message = `Votre code de recuperation est: ${token}`
            // const sms = await sendSMS("0022373030732", "0022373030732", message)
            // if (isEmpty(sms)) throw "Erreur d'envoie du code de recuperation"

            res.status(200).json({ response: token, message: "Code de recuperation envoyé" })
        }
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

//-----------@return true or false ----------------
//retrieve user by his id and verify his given forgot recovery code with the token define earlier 
//if token expired or token does't match his given code,we throw an error
exports.confirm_forgot_recovery_code = async (req, res) => {
    try {
        const { code, hostID } = req.body

        if (isEmpty(hostID)) throw "Veuillez d'abord vous authentifier!"
        if (isEmpty(code)) throw "Veuillez renseigner le code de recuperation"

        const user = await UserModel.findById(hostID)
        if (isEmpty(user)) throw "Veuillez-vous authentifier!"

        const data = jwt.verify(user?.forgot_password_token, process.env.JWT_SECRET)
        if (isEmpty(data.token)) throw "Votre code de recuperation est expiré"

        const expDate = new Date(data.exp * 1000)

        if (expDate < new Date())
            throw "Votre code de recuperation est expiré"

        if (!isEqual(code, data.token))
            throw "Votre code de recuperation est expiré"

        // if (code !== data.token!isEqual(code, data.token))
        // throw "Votre code de recuperation est expiré 3"

        res.send({ response: true })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//-----------@return 
exports.reset_forgot_password = async (req, res) => {
    try {
        let { password, confirm, hostID } = req.body
        if (isEmpty(password)) throw "Veuillez renseigner un mot de passe."
        if (password && password.length < 6) throw "Mot de passe trop court."
        if (!isEqual(password, confirm)) throw "Les mots de passe ne correspondent pas."



        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)

        const user = await UserModel.findByIdAndUpdate(hostID, { $set: { password } }, { new: true })
        if (isEmpty(user)) throw "Erreur de reinitialisation du mot de passe."

        res.status(200).json({ response: user, message: "Mot de passe modifié avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }

}