const JsonWebToken = require("jsonwebtoken")
const UserModel = require("../models/user.model")
const { isEmpty, genKey, sendSMS } = require("../utils/functions")
const bcrypt = require('bcrypt')

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

//get user profile by checking token validity, if token is valid we get user's id from req using middleware
//then we get user's data through his model
exports.profile = async (req, res) => {
    try {
        const user = await UserModel.findById(req.id).select("-password")

        if (isEmpty(user)) return res.status(401).send({ message: "Erreur d'authentification" })

        res.status(200).send({ response: user, message: "Profile utilisateur recupéré avec succès." })
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

//login user by his phone number and password
//we search user by his phone number then match, we compare his password with the searched one password
//if password also matched, we return his token and his datas
//by default his token expire in 3 hours
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body

        const error = req.error
        if (!isEmpty(error)) return res.status(401).send({ message: error })

        //find user by phone number
        const user = await UserModel.findOne({ phone }).select("-password")

        //if user doesn't exist
        if (isEmpty(user)) return res.status(401).json({ message: "E-mail ou mot de passe incorrect." })

        //check if password is right
        const passwordMatched = await bcrypt.compare(password, user.password)
        if (!passwordMatched)
            return res.status(401).json({ message: `E-mail ou mot de passe est incorrect.` })

        // Create token JWT who expired in 3hours
        const token = JsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3h" })

        // Retour de la réponse avec le token et l'employé connecté
        res.status(200).json({ token, response: user })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

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
    const { email, phone, password } = req.body

    UserModel.find()
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

                // va contenir le hash du message
                bcrypt.hash(password, 10)
                    .then(hash => {
                        const user = new UserModel({ email, phone, password: hash })

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
                                        .catch((error) => res.status(500).json({ message: error.message }))
                                })
                                .catch((error) => res.status(500).json({ message: error.message }))
                        })
                    })
                    .catch((error) => res.status(500).json({ message: error.message }))
            } else {
                bcrypt.hash(password, 10)
                    .then(hash => {
                        const user = new UserModel({ email, phone, password: hash })

                        const licenceKey = genKey()
                        licenceKey.get((error, code) => {
                            if (error) return res.status(500).json({ message: error.message })

                            user.save()
                                .then((user) => {
                                    user.licenseKey = code

                                    user.save()
                                        .then((user) => {

                                            sendSMS("0022379364385", "0022373030732", code)
                                                .then(sms => {
                                                    res.status(201).json({ response: user, message: "L'utilisateur a été crée avec succès", sms })
                                                })
                                                .catch((error) => res.status(500).json({ message: error.message }))
                                        })
                                        .catch((error) => res.status(500).json({ message: error.message }))
                                })
                                .catch((error) => res.status(500).json({ message: error.message }))
                        })
                    })
                    .catch((error) => res.status(500).json({ message: error.message }))
            }
        })
        .catch((error) => res.status(500).json({ message: error.message }))
}



