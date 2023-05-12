const JsonWebToken = require("jsonwebtoken")
const UserModel = require("../models/user.model")
const { isEmpty } = require("../utils/functions")
const bcrypt = require('bcrypt')
const { regex } = require("../utils/constants")
const { removePhoneIndicatif } = require("../utils/functions")
const { send_notif_func } = require("./notification.controller")

//----------- @return boolean depending on whether the user token is valid or not ------------------
//check if got token is valid then send true else send false
exports.checking = async (req, res) => {
    try {
        let token = req.header("token")

        const data = JsonWebToken.verify(token, process.env.JWT_SECRET)
        if (isEmpty(data.id)) return res.status(200).send(false)

        const user = await UserModel.findById(data.id)
        if (isEmpty(user)) return res.status(200).send(false)

        res.status(200).send(true)
    } catch (error) {
        return res.status(500).send({ message: false })
    }
}

//----------- @return "logged user's profile data" ------------------
//get user profile by checking token validity, if token is valid we get user's id from req using middleware
//then we get user's data through his model
exports.profile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.id).select("-password")

        if (isEmpty(user)) throw "Erreur d'authentification"

        res.status(200).send({ response: user, message: "Profile utilisateur recupéré avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//----------- @return "logged user's data" and "token" ------------------
//login user by his phone number and password
//we search user by his phone number then match, we compare his password with the searched one password
//if password also matched, we return his token and his datas
//by default his token expire in 3 hours
exports.login = async (req, res) => {
    try {
        var { email, phone, dashboard } = req.body;
        if (email) email = req.body.email.toLowerCase().trim();
        if (phone) phone = removePhoneIndicatif(req.body.phone.trim());

        var user = null;
        if (email && email !== "" && (dashboard || dashboard !== "")) user = await UserModel.findOne({ email });
        else if (phone) user = await UserModel.findOne({ phone });


        let msg = email ? "Nom d'utilisateur" : phone && "Numero de téléphone";

        if (isEmpty(user) || user === null) throw `${msg} ou le mot de passe est incorrect. `;


        const pass = await bcrypt.compare(req.body.password, user.password);
        if (!pass) throw `${msg} ou le mot de passe est incorrect.`;

        if (dashboard && !user?.admin) throw `${msg} ou le mot de passe est incorrect.`;
        if (user?.rejected) throw "Vous n'êtes plus autorisé a acceder a ce compte. Veuillez-nous contacter pour plus de renseignement."


        // Create token JWT who expired in 3hours
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })

        let { password, ...rest } = user._doc

        let title = "Authentification";
        let body = "Authentification reussie!"
        let to = user?.notification_token
        let data = { type: "success" }
        await send_notif_func(title, body, to, data)

        // Retour de la réponse avec le token et l'employé connecté
        res.status(200).json({ token, response: rest, message: rest.license_status ? "Vous êtes connecté." : !rest.license_status && "Activer votre compte." })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error })
    }

}


exports.signup = async (req, res) => {
    try {
        const { activation_code, code, password_confirm, facebook, dashboard } = req.body

        const phone = removePhoneIndicatif(req.body.phone)

        const isExist = await UserModel.findOne({ phone })

        if (!isEmpty(isExist)) throw "Ce compte existe deja."
        if (phone === "") throw "Un numéro de telephone est requis."
        if (phone && !regex.phone.test(phone)) throw " Format du numéro de telephone incorrect."
        if (isEmpty(req.body.password) || req.body.password === "") throw "Un mot de passe est requis."
        if (req.body.password.length < 6) throw "Mot de passe trop court. Min: 6 caractères"
        if (!dashboard) if (req.body.password !== password_confirm) throw "Les mots de passe ne se correspondent pas."
        if (!dashboard) if (activation_code !== code) throw "Code d'activation incorrect."

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        const toStore = new UserModel({ phone, password: hash })

        const users = await UserModel.find({ vip: true });

        if (users.length !== 0) {
            let getAllNumbersPhoneInvited = users.flatMap(user => user.invitations)
                .filter((phone, index, phones) => phones.indexOf(phone) === index);

            if (getAllNumbersPhoneInvited.includes(phone)) toStore.vip = true
        }

        if (!isEmpty(facebook) || facebook !== null) toStore.facebook = facebook
        if (!isEmpty(req.body.notification_token) || req.body.notification_token !== "") toStore.notification_token = req.body.notification_token

        if (dashboard && dashboard !== "") {
            if (req.body.email) toStore.email = req.body.email?.toLowerCase()?.trim()
            if (req.body.town) toStore.town = req.body.town?.trim()
            if (req.body.vip) toStore.vip = req.body.vip
            if (req.body.admin) toStore.admin = req.body.admin
            if (req.body.image) toStore.image = req.body.image
            if (req.body.name) toStore.name = req.body.name?.trim()
        }

        const user = await toStore.save()

        let title = "Creation de compte";
        let body = "Votre compte à été crée avec succès."
        let to = user?.notification_token

        const notif = await send_notif_func(title, body, "", to, null)

        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })
        let { password, ...rest } = user._doc

        res.status(200).json({ token, response: rest, notif, message: "Creation de compte reussie." })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error });
    }

}
