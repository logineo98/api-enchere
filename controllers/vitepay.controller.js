const EnchereModel = require("../models/enchere.model")
const UserModel = require("../models/user.model")

exports.vitepay_callback = async (req, res) => {
    try {
        const { authenticity, order_id, sandbox, success, failure } = req.body

        if (order_id && authenticity) {

            const api_secret = process.env.API_SECRET_KEY
            const orderID = order_id

            if (orderID && orderID !== "") {
                const user = await UserModel.findById(orderID)
                if (!user) throw "Une erreur est survenue au niveau du serveur lors de la recuperation de l'utilisateur ou utilisateur non trouvé"

                const enchere = await EnchereModel.findById(user?.tmp?.enchereID)
                if (!enchere) return res.status(404).json({ status: 0, message: "Désolé, aucune enchère correspondante n'a été trouvée." })

                // const amount_gived = user?.tmp?.montant * 100
                // let our_authenticity = `${orderID};${amount_gived};XOF;${api_secret}`.toUpperCase();

                // if (authenticity === our_authenticity) {
                if (success && success == 1) {
                    if (sandbox == 1) {
                        // enchere.title = "tz nation"
                        // const enchere_after_participation = await enchere.save()
                        // if (!enchere_after_participation) return res.send({ status: 0, message: "" })

                        // res.send({ status: 1 })

                        if (user?.tmp?.reserve_price && user?.tmp?.reserve_price === true) {
                            enchere.history.push({ buyerID, reserve_price: true, real_montant: enchere.reserve_price, montant: enchere.reserve_price, date: new Date().getTime() })
                            enchere.enchere_status = "closed"

                            const enchere_after_participation = await enchere.save()
                            if (!enchere_after_participation) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère." })

                            user.tmp = null
                            const user_after_participate_encher = await user.save()
                            if (!user_after_participate_encher) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la reinitialisation de la variable tmp dans user" })

                            res.send({ status: 1 })
                        } else {
                            // nous allons d'abord recuperer la derniere personne ayant participée à l'enchère afin de pouvoir faire l'incrementation des montants si le montant choisi par l'encherisseur n'est le montant de reserve
                            if (enchere.history.length !== 0) {
                                // recuperation du dernier encherisseur
                                const get_last_encherisseur = enchere.history[enchere.history.length - 1]

                                enchere.history.push({ buyerID, real_montant: user?.tmp?.montant, montant: get_last_encherisseur.montant + user?.tmp?.montant, date: new Date().getTime() })

                                const enchere_after_participation = await enchere.save()
                                if (!enchere_after_participation) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère." })

                                user.tmp = null
                                const user_after_participate_encher = await user.save()
                                if (!user_after_participate_encher) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la reinitialisation de la variable tmp dans user" })

                                res.send({ status: 1 })
                            } else {
                                enchere.history.push({ buyerID, real_montant: user?.tmp?.montant, montant: enchere.started_price + user?.tmp?.montant, date: new Date().getTime() })

                                const enchere_after_participation = await enchere.save()
                                if (!enchere_after_participation) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère." })

                                user.tmp = null
                                const user_after_participate_encher = await user.save()
                                if (!user_after_participate_encher) return res.status(500).json({ status: 0, message: "Une erreur est survenue au niveau du serveur lors de la reinitialisation de la variable tmp dans user" })

                                res.send({ status: 1 })
                            }
                        }
                    }
                } else if (failure && failure == 1) {
                    const enchere_updated = await EnchereModel.findByIdAndUpdate(user?.tmp?.enchereID, { title: "kougnon" }, { new: true })
                    if (!enchere_updated) throw "Une erreur est survenue lors de la mise a jour de l'enchère!"

                    res.send({ status: 0, message: "Raison inconnu pour le moment" })
                }
                // }
            }
        }
    } catch (error) {
        res.status(500).send({ status: 0, message: error })
    }
}

