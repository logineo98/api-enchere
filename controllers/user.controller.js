const { isValidObjectId } = require("mongoose");
const UserModel = require("../models/user.model");
const { isEmpty } = require("../utils/functions");

exports.update_user = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.get_user = async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).select("-password")
        if (isEmpty(user)) return res.status(401).json({ message: "Cet utilisateur n'existe pas" })

        res.status(401).json({ response: user, message: "Utilisateur recuperer avec succès" })
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

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

exports.send_invitation = (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: "Désolé l'identifiant de l'utilisateur n'est pas correc !" });
    }
}