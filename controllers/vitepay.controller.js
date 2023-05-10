const { isValidObjectId } = require("mongoose")
const EnchereModel = require("../models/enchere.model")
const UserModel = require("../models/user.model")

exports.vitepay_callback = async (req, res) => {
    try {
        const { authenticity, order_id, sandbox, success, failure } = req.body

        if (order_id && authenticity) {

            // const api_secret = process.env.API_SECRET_KEY
            const orderID = order_id

            if (orderID && orderID !== "") {
                if (!isValidObjectId(orderID)) throw "Identifiant de order_id invalide"

                const user = await UserModel.findById(orderID)
                if (!user) throw "Utilisateur non trouvé ou Erreur survenue au niveau du serveur"

                if (!isValidObjectId(user?.tmp?.enchereID)) throw "Identifiant de l'enchère invalide"

                const enchere = await EnchereModel.findById(user?.tmp?.enchereID)
                if (!enchere) throw "Enchère non trouvée ou Erreur survenue au niveau du serveur"

                // const amount_gived = user?.tmp?.montant * 100
                // let our_authenticity = `${orderID};${amount_gived};XOF;${api_secret}`.toUpperCase();

                // if (authenticity === our_authenticity) {
                if (success && success == 1) {
                    if (sandbox == 1 || sandbox == 0) {
                        if (user?.tmp?.reserve_price && user?.tmp?.reserve_price === true) {
                            enchere.history.push({ buyerID: orderID, reserve_price: true, real_montant: enchere.reserve_price, montant: enchere.reserve_price, date: new Date().getTime() })
                            enchere.enchere_status = "closed"

                            const enchere_after_participation = await enchere.save()
                            if (!enchere_after_participation) throw "Erreur survenue au niveau du serveur lors de la mise à jour des données de l'enchère"

                            user.tmp = null
                            const user_after_participate_enchere = await user.save()
                            if (!user_after_participate_enchere) throw "Erreur survenue au niveau du serveur lors de la mise de la variable tmp à null"

                            res.send({ status: 1 })
                        } else {
                            // nous allons d'abord recuperer la derniere personne ayant participée à l'enchère afin de pouvoir faire l'incrementation des montants si le montant choisi par l'encherisseur n'est le montant de reserve
                            if (enchere.history.length !== 0) {
                                // recuperation du dernier encherisseur
                                const get_last_encherisseur = enchere.history[enchere.history.length - 1]

                                enchere.history.push({ buyerID: orderID, reserve_price: false, real_montant: user?.tmp?.montant, montant: get_last_encherisseur.montant + user?.tmp?.montant, date: new Date().getTime() })

                                const enchere_after_participation = await enchere.save()
                                if (!enchere_after_participation) throw "Erreur survenue au niveau du serveur lors de la mise à jour des données de l'enchère"

                                user.tmp = null
                                const user_after_participate_enchere = await user.save()
                                if (!user_after_participate_enchere) throw "Erreur survenue au niveau du serveur lors de la mise de la variable tmp à null"

                                res.send({ status: 1 })
                            } else {
                                enchere.history.push({ buyerID: orderID, reserve_price: false, real_montant: user?.tmp?.montant, montant: enchere.started_price + user?.tmp?.montant, date: new Date().getTime() })

                                const enchere_after_participation = await enchere.save()
                                if (!enchere_after_participation) throw "Erreur survenue au niveau du serveur lors de la mise à jour des données de l'enchère"

                                user.tmp = null
                                const user_after_participate_enchere = await user.save()
                                if (!user_after_participate_enchere) throw "Erreur survenue au niveau du serveur lors de la mise de la variable tmp à null"

                                res.send({ status: 1 })
                            }
                        }
                    } else throw "sandbox est different de 0 ou 1"
                } else if (failure && failure == 1) {
                    user.tmp = null
                    const user_after_participate_enchere = await user.save()
                    if (!user_after_participate_enchere) throw "Erreur survenue au niveau du serveur lors de la mise de la variable tmp à null"

                    return res.send({ status: 0, message: "L'utilisateur n'a pas confirmé son paiement" })
                } else throw "Erreur inconnue pour le moment"
                // }
            }
        }
    } catch (error) {
        res.send({ status: 0, message: error })
    }
}
