
const JsonWebToken = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { isEmpty } = require("../utils/functions");
const bcrypt = require('bcrypt');

//check if got token is valid then send true else send false
exports.checking = async (req, res) => {
    try {
        let token = req.header("token");

        const data = JsonWebToken.verify(token, process.env.JWT_SECRET);
        if (isEmpty(data.id)) res.send(false);

        const user = await UserModel.findById(data.id);
        if (isEmpty(user)) return res.status(404).send(false);

        return res.send(true);
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

//get user profile by checking token validity, if token is valid we get user's id from req using middleware
//then we get user's data through his model
exports.profile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.id)

        if (isEmpty(user)) return res.status(401).send({ message: "Erreur d'authentification" })

        res.status(200).send({ response: user, message: "Profile utilisateur recupéré avec succès." })
    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

//login user by his phone number and password
//we seach user by his phone number then match, we compare his password with the searched one password
//if password also matched, we return his token and his datas
//by default his token expire in 3 hours
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body

        const error = req.error;
        if (!isEmpty(error)) return res.status(401).send({ message: error });

        //find user by e-mail
        const user = await UserModel.findOne({ phone })

        //if user doesn't exist
        if (isEmpty(user)) return res.status(401).json({ message: "E-mail ou mot de passe incorrect." })

        //check if password is right
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched)
            return res.status(401).json({ message: `E-mail ou mot de passe est incorrect.` });

        // Create token JWT who expired in 3hours
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" });

        // Retour de la réponse avec le token et l'employé connecté
        res.status(200).json({ token, response: user });

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.register = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}