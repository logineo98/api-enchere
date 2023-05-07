const JsonWebToken = require("jsonwebtoken")
const UserModel = require("../models/user.model")
const { isEmpty, genKey, sendSMSTwilio, genRandomNums } = require("../utils/functions")
const bcrypt = require('bcrypt')
const { isValidObjectId } = require("mongoose")
const { constants, regex } = require("../utils/constants")
const { removePhoneIndicatif } = require("../utils/functions")

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
        if (phone) phone = req.body.phone.trim();

        var user = null;
        if (email && email !== "" && (dashboard || dashboard !== "")) user = await UserModel.findOne({ email });
        else if (phone) user = await UserModel.findOne({ phone });


        let msg = email ? "Nom d'utilisateur" : phone && "Numero de téléphone";

        if (isEmpty(user) || user === null) throw `${msg} ou le mot de passe est incorrect. `;


        const pass = await bcrypt.compare(req.body.password, user.password);
        if (!pass) throw `${msg} ou le mot de passe est incorrect.`;

        // Create token JWT who expired in 3hours
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })

        let { password, ...rest } = user._doc

        // Retour de la réponse avec le token et l'employé connecté
        res.status(200).json({ token, response: rest, message: rest.license_status ? "Vous êtes connecté." : !rest.license_status && "Activer votre compte." })

    } catch (error) {
        res.status(500).send({ message: error })
    }

}


//----------- @return "logged user's data" ------------------
//when user is logged we retrieve the licenseKey from his datas and compare it with his input licenseKey
//if it matches, we update his license_status to true else we throw errors
exports.licenseActivation = async (req, res) => {
    try {
        const { licenseKey, userID } = req.body

        if (!isValidObjectId(userID)) throw "ID fourni est incorrect ou invalide."
        if (!licenseKey || licenseKey === "") throw "Un code d'activation est requis."

        const user = await UserModel.findById(userID).select("-password")
        if (isEmpty(user)) throw "Ce compte n'existe pas."

        const isLicenseValid = licenseKey === user?.licenseKey ? true : false
        if (!isLicenseValid) throw "Le code d'activation est incorrect."

        const updated = await UserModel.findByIdAndUpdate(userID, { $set: { license_status: true } }, { new: true }).select("-password")
        if (isEmpty(updated)) throw "Echec d'activation de votre code."
        res.status(200).json({ response: updated, message: "Compte activé." })

    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error });
    }
}


exports.signup = async (req, res) => {
    try {
        const { activation_code, code, password_confirm, facebook } = req.body

        const phone = removePhoneIndicatif(req.body.phone)

        const isExist = await UserModel.findOne({ phone })

        if (!isEmpty(isExist)) throw "Ce compte existe deja."
        if (phone === "") throw "Un numéro de telephone est requis."
        if (phone && !regex.phone.test(phone)) throw " Format du numéro de telephone incorrect."
        if (isEmpty(req.body.password) || req.body.password === "") throw "Un mot de passe est requis."
        if (req.body.password.length < 6) throw "Mot de passe trop court. Min: 6 caractères"
        if (req.body.password !== password_confirm) throw "Les mots de passe ne se correspondent pas."
        if (activation_code !== code) throw "Code d'activation incorrect."

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

        const user = await toStore.save()
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })
        let { password, ...rest } = user._doc

        res.status(200).json({ token, response: rest, message: "Creation de compte reussie." })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error });
    }

}


// exports.register = (req, res) => {
//     const { phone, password, password_confirm } = req.body

//     const { error, initialError } = register_validation(phone, password, password_confirm)


//     if (error !== initialError) {
//         return res.status(400).json({ message: error })
//     } else {

//         UserModel.find({ vip: true })
//             .then(users => {
//                 if (users.length !== 0) {
//                     // ce tableau va contenir la liste des numeros de telephone invité
//                     let getAllNumbersPhoneInvited = []

//                     users.forEach(user => {
//                         if (user.invitations.length !== 0) {
//                             user.invitations.forEach(phone => {
//                                 if (!getAllNumbersPhoneInvited.includes(phone)) getAllNumbersPhoneInvited.push(phone)
//                             })
//                         }
//                     })

//                     // une clé de licence sera generee
//                     const licenceKey = genKey()
//                     licenceKey.get((error, code) => {
//                         if (error) return res.status(500).json({ message: error.message })

//                         bcrypt.hash(password, 10)
//                             .then(hash => {
//                                 const user = new UserModel({ phone, password: hash })

//                                 user.save()
//                                     .then((user) => {
//                                         user.licenseKey = code
//                                         if (getAllNumbersPhoneInvited.includes(phone)) user.vip = true

//                                         user.save()
//                                             .then((user) => {

//                                                 // l'envoie de la clé de la licence a l'utilisateur
//                                                 // sendSMS(constants.sms_sender_number, "00223" + user?.phone, code)
//                                                 sendSMSTwilio("+223" + user.phone, code)
//                                                     .then(sms => {
//                                                         res.status(201).json({ response: user, message: "L'utilisateur a été crée avec succès", sms })
//                                                     })
//                                                     .catch((error) => res.status(500).json({ message: error.message }))
//                                             })
//                                             .catch((error) => res.status(500).json({ message: error }))
//                                     })
//                                     .catch((error) => res.status(500).json(register_error_validation(error)))
//                             })
//                             .catch(error => res.status(500).json({ message: error }))
//                     })
//                 } else {
//                     const licenceKey = genKey()
//                     licenceKey.get((error, code) => {
//                         if (error) return res.status(500).json({ message: error.message })

//                         bcrypt.hash(password, 10)
//                             .then(hash => {
//                                 const user = new UserModel({ phone, password: hash })

//                                 user.save()
//                                     .then((user) => {
//                                         user.licenseKey = code

//                                         user.save()
//                                             .then((user) => {

//                                                 // sendSMS(constants.sms_sender_number, "00223" + user?.phone, code)
//                                                 sendSMSTwilio("+223" + user.phone, code)
//                                                     .then(sms => {
//                                                         res.status(201).json({ response: user, message: "L'utilisateur a été crée avec succès", sms })
//                                                     })
//                                                     .catch((error) => res.status(500).json({ message: error.message }))
//                                             })
//                                             .catch((error) => res.status(500).json({ message: error.message }))
//                                     })
//                                     .catch((error) => res.status(500).json(register_error_validation(error)))
//                             })
//                             .catch(error => res.status(500).json({ message: error }))
//                     })
//                 }
//             })
//             .catch((error) => res.status(500).json({ message: error.message }))
//     }
// }