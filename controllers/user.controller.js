const { isValidObjectId } = require("mongoose");
const UserModel = require("../models/user.model");
const { isEmpty, sendSMS } = require("../utils/functions");
const bcrypt = require('bcrypt');
const { send_invitation_validation } = require("../utils/validations");

//update user's info and password if exist
//@return "user's data" and "success message"
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
        res.status(500).send({ message: error.message });
    }

}

//retrieve user's datas by his ID
//------------ @return finding "user's data" and "success message" -----------------
exports.get_user = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password")
        if (isEmpty(user)) return res.status(401).json({ message: "Cet utilisateur n'existe pas" })

        res.status(401).json({ response: user, message: "Utilisateur recuperer avec succès" })
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

//retrieve users datas
//----------------- @return an "Array of users" and "success message" -----------------
exports.get_users = async (req, res) => {
    try {
        const user = await UserModel.find().select("-password")

        let message;
        if (isEmpty(user)) message = "Liste des utilisateurs est vide"

        res.status(401).json({ response: user, message: message ? message : "Utilisateur recuperer avec succès" })
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.delete_user = async (req, res) => {
    try {
        if (isEmpty(req.params.id) || !isValidObjectId(req.params.id)) throw "Identifiant utilisateur invalide ou incorrect."

        const user = await UserModel.findByIdAndDelete(req.params.id)
        if (isEmpty(user)) throw "Echec de suppression"

        res.status(200).json({ response: user, message: "Utilisateur supprimé avec succès." })
    } catch (error) {
        res.status(500).send({ message: error });
    }
}

exports.send_invitation = (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Désolé l'identifiant de l'utilisateur n'est pas correct !" });
    }

    const { friend_phone } = req.body

    const { error, initialError } = send_invitation_validation(friend_phone)

    if (error !== initialError) {
        return res.status(400).json({ message: error })
    } else {
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
}