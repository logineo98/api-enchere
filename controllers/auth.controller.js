const JsonWebToken = require("jsonwebtoken")
const UserModel = require("../models/user.model")
const { isEmpty, genKey, sendSMS } = require("../utils/functions")
const bcrypt = require('bcrypt')
const { register_validation, register_error_validation } = require("../utils/validations")


//----------- @return boolean depending on whether the user token is valid or not ------------------
//check if got token is valid then send true else send false
exports.checking = async (req, res) => {
    try {
        let token = req.header("token")

        const data = JsonWebToken.verify(token, process.env.JWT_SECRET)
        if (isEmpty(data.id)) res.send(false)

        const user = await UserModel.findById(data.id)
        if (isEmpty(user)) return res.status(404).send(false)

        return res.send(true)
    } catch (error) {
        return res.status(500).send({ message: error.message })
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
        const { phone } = req.body

        const error = req.error
        if (!isEmpty(error)) return res.status(401).send({ message: error })

        //find user by phone number
        const user = await UserModel.findOne({ phone })

        //if user doesn't exist
        if (isEmpty(user)) return res.status(401).json({ message: "E-mail ou mot de passe incorrect." })

        //check if password is right
        const passwordMatched = bcrypt.compare(req.body.password, user.password)
        if (!passwordMatched)
            return res.status(401).json({ message: `E-mail ou mot de passe est incorrect.` })

        // Create token JWT who expired in 3hours
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })

        let { password, ...rest } = user._doc

        // Retour de la réponse avec le token et l'employé connecté
        res.status(200).json({ token, response: rest })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

//----------- @return "logged user's data" ------------------
//when user is logged we retrieve the licenseKey from his datas and compare it with his input licenseKey
//if it matches, we update his license_status to true else we throw errors
exports.licenseActivation = async (req, res) => {
    try {
        const { licenseKey, userID } = req.body

        const error = req.error;
        if (!isEmpty(error)) return res.status(401).send({ message: error });

        const user = await UserModel.findById(userID).select("-password")
        if (isEmpty(user)) return res.status(401).json({ message: "Ce compte n'existe pas." })

        const isLicenseValid = licenseKey === user?.licenseKey ? true : false
        if (!isLicenseValid) return res.status(404).json({ message: "Votre code est incorrect" })

        const updated = await UserModel.findByIdAndUpdate(userID, { $set: { license_status: true } }, { new: true }).select("-password")
        if (isEmpty(updated)) return res.status(404).json({ message: "Echec d'activation de votre code" })

        res.status(200).json({ response: updated, message: "Activation du code reussie!" })

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
}

exports.register = (req, res) => {
    const { phone, password, password_confirm } = req.body

    const { error, initialError } = register_validation(phone, password, password_confirm)

    const user = new UserModel({ phone, password })

    if (error !== initialError) {
        return res.status(400).json({ message: error })
    } else {
        UserModel.find({ vip: true })
            .then(users => {
                if (users.length !== 0) {
                    // ce tableau va contenir la liste des numeros de telephone invité
                    let getAllNumbersPhoneInvited = []

                    users.forEach(user => {
                        if (user.invitations.length !== 0) {
                            user.invitations.forEach(phone => {
                                if (!getAllNumbersPhoneInvited.includes(phone)) getAllNumbersPhoneInvited.push(phone)
                            })
                        }
                    })

                    // une clé de licence sera generee
                    const licenceKey = genKey()
                    licenceKey.get((error, code) => {
                        if (error) return res.status(500).json({ message: error.message })

                        user.save()
                            .then((user) => {
                                user.licenseKey = code
                                if (getAllNumbersPhoneInvited.includes(phone)) user.vip = true

                                user.save()
                                    .then((user) => {

                                        // l'envoie de la clé de la licence a l'utilisateur
                                        sendSMS("0022379364385", "0022373030732", code)
                                            .then(sms => {
                                                res.status(201).json({ response: user, message: "L'utilisateur a été crée avec succès", sms })
                                            })
                                            .catch((error) => res.status(500).json({ message: error.message }))
                                    })
                                    .catch((error) => res.status(500).json({ message: error }))
                            })
                            .catch((error) => res.status(500).json(register_error_validation(error)))
                    })

                } else {
                    const licenceKey = genKey()
                    licenceKey.get((error, code) => {
                        if (error) return res.status(500).json({ message: error.message })

                        user.save()
                            .then((user) => {
                                user.licenseKey = code

                                user.save()
                                    .then((user) => {

                                        sendSMS("0022373030732", "0022373030732", code)
                                            .then(sms => {
                                                res.status(201).json({ response: user, message: "L'utilisateur a été crée avec succès", sms })
                                            })
                                            .catch((error) => res.status(500).json({ message: error.message }))
                                    })
                                    .catch((error) => res.status(500).json({ message: error.message }))
                            })
                            .catch((error) => res.status(500).json(register_error_validation(error)))
                    })
                }
            })
            .catch((error) => res.status(500).json({ message: error.message }))
    }
}