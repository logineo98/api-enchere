const { isValidObjectId } = require("mongoose")
const EnchereModel = require("../models/enchere.model")
const { isEmpty } = require("../utils/functions")
const fs = require("fs")
const UserModel = require("../models/user.model")

//-------------@return article created data --------------------
exports.create_enchere = async (req, res) => {
    try {
        req.body.sellerID = req.body.hostID
        const enchere = new EnchereModel(req.body)
        const saved_data = await enchere.save()
        if (!saved_data) throw "Une erreur est survenue au niveau du serveur lors de la création de l'enchère."

        res.status(200).send({ response: saved_data, message: "Article mis en enchere avec succès mais en état d'attente patienter le temps que nous verifions la conformité de l'article avant de le mettre en enchère. Merci" })
    } catch (error) {
        res.status(500).send({ message: error })
    }

}

//-------------@return article by it id --------------------------
exports.get_enchere = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "L'identifiant de l'enchère est invalide." })

        const enchere = await EnchereModel.findById(req.params.id)
        if (!enchere) return res.status(404).json({ message: "Désolé, aucune enchère correspondante n'a été trouvée." })
        res.send({ response: enchere })
    } catch (error) {
        res.status(500).send({ message: error })
    }

}

//-------------@return all articles -----------------------------
exports.get_all_encheres = async (req, res) => {
    try {
        const encheres = await EnchereModel.find().sort({ createdAt: -1 })
        if (!encheres) throw "Une erreur est survenue au niveau du serveur lors de la recuperation des enchères."
        res.send({ response: encheres })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//----------@return enchere updated data ----------------------
//we retrieve enchere data by it id and update it
exports.update_enchere = async (req, res) => {
    try {
        const { old_img, new_img } = req.body
        const enchere = await EnchereModel.findById(req.params.id)
        if (!enchere) throw "Aucune enchère correspondante n'a été trouvée."

        let medias = enchere.medias

        if (old_img && (!isEmpty(old_img) || old_img?.length !== 0)) {
            medias?.forEach(media => {
                if (!old_img?.includes(media)) {
                    const typeFile = media?.split("-")[0]
                    let pathFilename = ""

                    if (typeFile === "image") {
                        pathFilename = `${__dirname}/../public/images/${media}`
                    } else if (typeFile === "video") {
                        pathFilename = `${__dirname}/../public/videos/${media}`
                    }

                    fs.unlink(pathFilename, (error) => {
                        if (error) throw error
                        console.log(`L'ancienne ${media} a été supprimée`)
                    })
                }
            })

            req.body.medias = new_img ? [...old_img, ...new_img] : [...old_img]
        }


        const enchere_after_update = await EnchereModel.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true })
        if (!enchere_after_update) throw "Une erreur est survenue au niveau du serveur lors de la mise à de l'enchère."
        res.send({ response: enchere_after_update, message: "La mise à jour de l'enchère a été effectuée avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//----------@return deleted article data --------------------------
exports.delete_enchere = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "L'identifiant de l'enchère est invalide." })

        const enchere = await EnchereModel.findById(req.params.id)

        if (enchere) {
            const medias = enchere?.medias
            medias?.forEach(media => {
                const typeFile = media?.split("-")[0]
                let pathFilename = ""

                if (typeFile === "image") {
                    pathFilename = `${__dirname}/../public/images/${media}`
                } else if (typeFile === "video") {
                    pathFilename = `${__dirname}/../public/videos/${media}`
                }

                fs.unlink(pathFilename, (error) => {
                    console.log("error========= ", error)
                    if (error) throw error
                    console.log(`${media} a été supprimée`)
                })

                enchere.deleteOne()
            })
            res.send({ response: enchere, message: "Suppression de l'enchère effectuée avec succès." })
        } else {
            return res.status(404).json({ message: "Désolé, aucune enchère correspondante n'a été trouvée." })
        }

    } catch (error) {
        res.status(500).send({ message: error })
    }

}

//----------return article and all its encheres as history ------------------
//when user choose reserve price, we allow him to win article with reserve price for that article
//when users make bids, we retrieve the last bid before his bid and update the last one with
//if only one user make a bid, we update the article's amount by adding user increment price 
exports.participate_in_enchere = async (req, res) => {
    try {
        const { buyerID, montant, reserve_price } = req.body

        if (!isValidObjectId(req.params.id) || !isValidObjectId(buyerID)) return res.status(400).json({ message: "(enchère ID ou buyerID) est(sont) invalide(s)." })

        const enchere = await EnchereModel.findById(req.params.id)
        if (!enchere) return res.status(404).json({ message: "Désolé, aucune enchère correspondante n'a été trouvée." })

        // si l'encherisseur a choisi le prix de reserve, l'enchère sera fermée
        if (reserve_price && !isEmpty(reserve_price)) {
            enchere.history.push({ buyerID, reserve_price: true, montant: enchere.reserve_price, date: new Date() })
            enchere.enchere_status = "closed"

            const enchere_after_participation = await enchere.save()
            if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."

            res.send({ response: enchere_after_participation })
        } else {
            // nous allons d'abord recuperer la derniere personne ayant participée à l'enchère afin de pouvoir faire l'incrementation des montants si le montant choisi par l'encherisseur n'est le montant de reserve
            if (enchere.history.length !== 0) {
                const get_last_encherisseur = enchere.history[enchere.history.length - 1]

                enchere.history.push({ buyerID, montant: get_last_encherisseur.montant + montant, date: new Date() })
                const enchere_after_participation = await enchere.save()
                if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."
                res.send({ response: enchere_after_participation })
            } else {
                enchere.history.push({ buyerID, montant: enchere.started_price + montant, date: new Date() })
                const enchere_after_participation = await enchere.save()
                if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."
                res.send({ response: enchere_after_participation })
            }
        }
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}

exports.search_result = async (req, res) => {

    try {
        const { search_text, search_by_filter } = req.body
        const encheres = await EnchereModel.find().sort({ createdAt: -1 })

        if (!isEmpty(encheres)) {
            let search_result = []


            for (const enchere of encheres) {
                if (search_text?.trim()) {
                    if (enchere.title.toLowerCase().trim().match(search_text.toLowerCase().trim()) || enchere.description.toLowerCase().trim().match(search_text.toLowerCase().trim())) {
                        search_result.push(enchere)
                    }
                } else {
                    const { lieu, categories, date, montant } = search_by_filter

                    if (!isEmpty(lieu)) {
                        const user = await UserModel.findById(enchere.sellerID)

                        if (lieu.includes(user.town.toLowerCase())) {
                            const enchere_verify = search_result.find(ench => ench._id == enchere._id)

                            if (enchere_verify === undefined) search_result.push(enchere)
                        }
                    }

                    if (!isEmpty(categories)) {
                        enchere.categories.forEach(category => {
                            if (categories.includes(category.toLowerCase())) {
                                const enchere_verify = search_result.find(ench => ench._id == enchere._id)

                                if (enchere_verify === undefined) search_result.push(enchere)
                            }
                        })
                    }

                    if (!isEmpty(date)) {
                        const date_f = new Date(date).getTime()
                        const enchere_createdAt = enchere.createdAt.getTime()

                        if (enchere_createdAt <= date_f) {
                            const enchere_verify = search_result.find(ench => ench._id == enchere._id)

                            if (enchere_verify === undefined) search_result.push(enchere)
                        }
                    }

                    if (!isEmpty(montant)) {
                        if (enchere.started_price <= montant) {
                            const enchere_verify = search_result.find(ench => ench._id == enchere._id)

                            if (enchere_verify === undefined) search_result.push(enchere)
                        }
                    }
                }
            }

            res.send({ response: search_result })
        } else {
            res.send({ message: "Aucune enchère n'existe." })
        }
    } catch (error) {
        res.status(500).send({ message: error })
    }

}

exports.filter_by_category = async (req, res) => {

    try {
        const encheres = await EnchereModel.find().sort({ createdAt: -1 })

        if (!isEmpty(encheres)) {
            let filter_by_category_result = []

            for (const enchere of encheres) {
                const { category } = req.body

                if (enchere.categories.includes(category)) {
                    const enchere_verify = filter_by_category_result.find(ench => ench._id == enchere._id)

                    if (enchere_verify === undefined) filter_by_category_result.push(enchere)
                }
            }

            res.send({ response: filter_by_category_result })
        } else {
            res.send({ message: "Aucune enchère n'existe." })
        }
    } catch (error) {
        res.status(500).send({ message: error })
    }

}

exports.like_enchere = async (req, res) => {
    try {
        const { user_id } = req.body

        if (!isValidObjectId(req.params.id) || !isValidObjectId(user_id)) {
            return res.status(400).json({ message: "Désolé l'identifiant de l'utilisateur ou de l'enchère n'est pas correct !" })
        }

        const enchere_after_update = await EnchereModel.findByIdAndUpdate(req.params.id, { $addToSet: { likes: user_id } }, { new: true })
        if (!enchere_after_update) throw "Désolé une erreur est survenue au niveau du serveur lors du like de l'enchère."

        res.send({ response: enchere_after_update, message: "Enchère ajoutée aux favoris avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

exports.dislike_enchere = async (req, res) => {
    try {
        const { user_id } = req.body

        if (!isValidObjectId(req.params.id) || !isValidObjectId(user_id)) {
            return res.status(400).json({ message: "Désolé l'identifiant de l'utilisateur ou de l'enchère n'est pas correct !" })
        }

        const enchere_after_update = await EnchereModel.findByIdAndUpdate(req.params.id, { $pull: { likes: user_id } }, { new: true })
        if (!enchere_after_update) throw "Désolé une erreur est survenue au niveau du serveur lors du like de l'enchère."

        res.send({ response: enchere_after_update, message: "Enchère retirée aux favoris avec succès." })
    } catch (error) {
        res.status(500).send({ message: error })
    }
}