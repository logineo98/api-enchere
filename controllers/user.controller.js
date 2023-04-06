const UserModel = require("../models/user.model");
const { isEmpty } = require("../utils/functions");
const bcrypt = require('bcrypt');

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

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.send_invitation = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}