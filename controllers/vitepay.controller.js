const EnchereModel = require("../models/enchere.model")
const UserModel = require("../models/user.model")
var sha1 = require('sha1')
const { getInsecureSHA1ofJSON } = require("../utils/functions")

exports.vitepay_callback = async (req, res) => {
    try {
        const { authenticity, order_id, sandbox, success, failure } = req.body

        if (order_id && authenticity) {

            const api_secret = process.env.API_SECRET_KEY
            const orderID = order_id

            if (orderID && orderID !== "") {
                const user = await UserModel.findById(orderID)
                if (!user) throw "Une erreur est survenue au niveau du serveur lors de la recuperation de l'utilisateur ou utilisateur non trouvé"

                const amount_gived = user?.tmp?.montant * 100
                let our_authenticity = `${orderID};${amount_gived};XOF;${api_secret}`
                our_authenticity = getInsecureSHA1ofJSON(our_authenticity).toUpperCase()
                console.log(our_authenticity)
                if (authenticity === our_authenticity) {
                    if (success && success == 1) {
                        if (sandbox == 1) {
                            const enchere_updated = await EnchereModel.findByIdAndUpdate(user.tmp.enchereID, { title: "tz" }, { new: true })
                            if (!enchere_updated) throw "Une erreur est survenue lors de la mise a jour de l'enchère!"

                            res.send({ status: "1" })
                        } else {
                            const enchere_updated = await EnchereModel.findByIdAndUpdate(user.tmp.enchereID, { title: "tz" }, { new: true })
                            if (!enchere_updated) throw "Une erreur est survenue lors de la mise a jour de l'enchère!"

                            res.send({ status: "1" });
                        }
                    } else if (failure && failure == 1) {
                        const enchere_updated = await EnchereModel.findByIdAndUpdate(user.tmp.enchereID, { title: "kougnon" }, { new: true })
                        if (!enchere_updated) throw "Une erreur est survenue lors de la mise a jour de l'enchère!"

                        res.send({ status: 0, message: "Raison inconnu pour le moment" })
                    }
                } else return res.send({ status: 0, message: "Les deux authenticity ne correspondent pas" })
            } else return res.send({ status: 0, message: "order_id non reçu" })
        } else return res.send({ status: 0, message: "order_id ou authenticity non reçu" })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}