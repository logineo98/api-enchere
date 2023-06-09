const { isValidObjectId } = require("mongoose")
const EnchereModel = require("../models/enchere.model")
const { isEmpty } = require("../utils/functions")
const fs = require("fs")

//-------------@return article created data --------------------
exports.create_enchere = async (req, res) => {
    try {
        const files = req.files

        if (!isEmpty(files))
            req.body.medias = req.files.map(file => file.filename)

        req.body.sellerID = req.body.hostID
        const enchere = new EnchereModel(req.body)
        const saved_data = await enchere.save()
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
        const encheres = await EnchereModel.find()
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
        const { title, description, categories, started_price, increase_price, reserve_price, expiration_time, enchere_type, enchere_status, reject_motif, trash } = req.body
        const files = req.files
        const enchere = await EnchereModel.findById(req.params.id)

        if (!isEmpty(files)) {
            const medias = enchere.medias

            medias.forEach(media => {
                const typeFile = media.split("-")[0]
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
            })

            enchere.medias = files.map(file => file.filename)
        }
        if (title) enchere.title = title
        if (description) enchere.description = description
        if (!isEmpty(categories)) enchere.categories = categories
        if (started_price) enchere.started_price = started_price
        if (increase_price) enchere.increase_price = increase_price
        if (reserve_price) enchere.reserve_price = reserve_price
        if (expiration_time) enchere.expiration_time = expiration_time
        if (enchere_type) enchere.enchere_type = enchere_type
        if (enchere_status) enchere.enchere_status = enchere_status
        if (reject_motif) enchere.reject_motif = reject_motif
        if (trash) enchere.trash = trash

        const enchere_after_update = await enchere.save()
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

        const enchere = await EnchereModel.findByIdAndDelete(req.params.id)

        if (enchere) {
            const medias = enchere.medias

            medias.forEach(media => {
                const typeFile = media.split("-")[0]
                let pathFilename = ""

                if (typeFile === "image") {
                    pathFilename = `${__dirname}/../public/images/${media}`
                } else if (typeFile === "video") {
                    pathFilename = `${__dirname}/../public/videos/${media}`
                }

                fs.unlink(pathFilename, (error) => {
                    if (error) throw error
                    console.log(`${media} a été supprimée`)
                })
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
            enchere.history.push({ buyerID, reserve_price: true, montant: enchere.reserve_price })
            enchere.enchere_status = "closed"

            const enchere_after_participation = await enchere.save()
            if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."

            res.send({ response: enchere_after_participation })
        } else {
            // nous allons d'abord recuperer la derniere personne ayant participée à l'enchère afin de pouvoir faire l'incrementation des montants si le montant choisi par l'encherisseur n'est le montant de reserve
            if (enchere.history.length !== 0) {
                const get_last_encherisseur = enchere.history[enchere.history.length - 1]

                enchere.history.push({ buyerID, montant: get_last_encherisseur.montant + montant })
                const enchere_after_participation = await enchere.save()
                if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."
                res.send({ response: enchere_after_participation })
            } else {
                enchere.history.push({ buyerID, montant: enchere.started_price + montant })
                const enchere_after_participation = await enchere.save()
                if (!enchere_after_participation) throw "Une erreur est survenue au niveau du serveur lors de la participation à l'enchère."
                res.send({ response: enchere_after_participation })
            }
        }
    } catch (error) {
        res.status(500).send({ message: error.message })
    }

}