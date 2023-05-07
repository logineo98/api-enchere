const { isValidObjectId } = require("mongoose")
const UserModel = require("../models/user.model")
const { send_invitation_validation } = require("../utils/validations")
const { isEmpty, genRandomNums, isEqual, sendSMSTwilio } = require("../utils/functions")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const EnchereModel = require("../models/enchere.model")
const { constants, regex } = require("../utils/constants")


//--------- @return "user's data" and "success message" ----------------
//update user's info and password if exist
exports.update_user = async (req, res) => {
    try {
        if (!isEmpty(req.body.password)) {
            const salt = await bcrypt.genSalt(10)
            req.body.password = await bcrypt.hash(req.body.password, salt)
        }

        const user = await UserModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select("-password")

        if (isEmpty(user)) throw "Mise à jour de cet utilisateur impossible"
        res.status(200).json({ response: user, message: "Informations de l'utilisateur mise à jour." })
    } catch (error) {
        console.log(error.message || error)
        res.status(500).send({ message: error })
    }
}

//------------ @return finding "user's data" and "success message" -----------------
//retrieve user's datas by his ID
exports.get_user = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password")
        if (isEmpty(user)) throw "Cet utilisateur n'existe pas"

        res.status(401).json({ response: user, message: "Utilisateur recuperer avec succès" })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//------------ @return an "Array of users" and "success message" -----------------
//retrieve users datas
exports.get_users = async (req, res) => {
    try {
        const user = await UserModel.find().sort({ createdAt: -1 }).select("-password")

        res.status(200).json({ response: user, message: "" })
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
                                    // sendSMS(constants.sms_sender_number, "+223" + user?.phone, "Lien de Play Store")
                                    sendSMSTwilio("+223" + user.phone, "Lien de Play Store")
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
                            sendSMSTwilio("+223" + user.phone, "Lien de Play Store")
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

//mot de passe oublier
exports.forgot_password = async (req, res) => {
    try {
        const { plateforme, phone } = req.body

        if (phone === "" || isEmpty(phone)) throw "Un numéro de téléphone est requis!"

        const user = await UserModel.findOne({ phone })
        if (isEmpty(user) || !user) throw "Ce compte n'existe pas."

        if (plateforme === "android") {
            const token = genRandomNums(4)

            const payload = { token }
            const options = { expiresIn: 15 * 60 }


            const forgot_password_token = jwt.sign(payload, process.env.JWT_SECRET, options)
            const updated = await UserModel.findOneAndUpdate(user?._id, { $set: { forgot_password_token } }, { new: true, upsert: true })

            if (isEmpty(updated)) throw "Erreur de reinitialisation du mot de passe"


            let message = `Votre code de recuperation est: ${token}`
            // const sms = await sendSMS("0022379364385", "0022379364385", message)
            // const sms = await sendSMSTwilio("+223" + phone, message)

            // if (isEmpty(sms) || sms === null) throw "Erreur d'envoie du code de recuperation"

            res.status(200).json({ response: { token, phone }, message: "Code de recuperation envoyé" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error })
    }

}

//-----------@return true or false ----------------
//retrieve user by his id and verify his given forgot recovery code with the token define earlier 
//if token expired or token does't match his given code,we throw an error
exports.confirm_forgot_recovery_code = async (req, res) => {
    try {
        const { code, phone } = req.body


        if (isEmpty(code) || code === "") throw "Le code de récupération est requis."

        const user = await UserModel.findOne({ phone })
        if (isEmpty(user)) throw "Le code est incorrect."

        const data = jwt.verify(user?.forgot_password_token, process.env.JWT_SECRET)
        if (isEmpty(data.token)) throw "Le code a expiré."

        const expDate = new Date(data.exp * 1000)

        if (expDate < new Date())
            throw "Le code de récupération est invalide/expiré"

        if (code !== data.token)
            throw "Le code de recuperation est invalide/expiré"

        let ans = code === data.token ? true : false;
        res.send({ response: { code_status: ans, phone }, message: ans ? "Code est correct." : "" })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//reinitialiser mot de passe
exports.reset_forgot_password = async (req, res) => {
    try {
        let { password, confirm, phone } = req.body
        if (isEmpty(password) || password === "") throw "Un mot de passe est requis."
        if (password && password.length < 6) throw "Taille mot de passe trop court. Minimum: 6 caractères."
        if (!isEqual(password, confirm)) throw "Les mots de passe ne se correspondent pas."



        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)

        const user = await UserModel.findOneAndUpdate({ phone }, { $set: { password } }, { new: true }).select("-password")
        if (isEmpty(user)) throw "Erreur lors de la réinitialisation du mot de passe."

        res.status(200).json({ response: user, message: "Mot de passe modifié." })
    } catch (error) {
        res.status(500).send({ message: error })
    }

}

exports.getAllFirebaseToken = async (req, res) => {
    try {
        const users = await UserModel.find()
        let allToken = []

        if (!isEmpty(users)) {
            users.forEach(user => {
                if (user.notification_token) {
                    if (!allToken.includes(user.notification_token)) allToken.push(user.notification_token)
                }
            })

            res.send({ response: allToken })
        } else {
            return res.send({ response: "Aucun utilisateur n'existe pour le moment !" })
        }

    } catch (error) {
        res.status(500).send({ message: error })
    }
}

exports.checkingPhone = async (req, res) => {
    try {
        const { phone, password, password_confirm } = req.body

        const isExist = await UserModel.findOne({ phone })

        if (!isEmpty(isExist)) throw "Ce compte existe deja."
        if (phone === "") throw "Un numéro de telephone est requis."
        if (phone && !regex.phone.test(phone)) throw " Format du numéro de telephone incorrect."
        if (isEmpty(password) || password === "") throw "Un mot de passe est requis."
        if (password.length < 6) throw "Mot de passe trop court. Min: 6 caractères"
        if (password !== password_confirm) throw "Les mots de passe ne se correspondent pas."

        const code = genRandomNums(5)

        const message = "Le code d'activation de votre compte est: " + code
        // const sms = await sendSMSTwilio("+223" + phone, message)
        // if (isEmpty(sms) || sms === null) throw "Erreur lors de l'envoi du code d'activation."
        console.log(code)
        res.status(200).json({ response: code, message: "Code d'activation envoyé." })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error || error.message })
    }
}

