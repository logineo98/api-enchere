const { isValidObjectId } = require("mongoose")
const { upload } = require("../middleware/middleware")
const EnchereModel = require("../models/enchere.model")
const { isEmpty } = require("../utils/functions")

//-------------@return article created data --------------------
exports.create_enchere = async (req, res) => {
    try {
        req.body.sellerID=req.body.hostID
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
        const enchere =await EnchereModel.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,upsert:true})
        res.status(200).json({response:enchere})
    } catch (error) {
        res.status(500).send({ message: error })
    }
}

//----------@return deleted article data --------------------------
exports.delete_enchere = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "L'identifiant de l'enchère est invalide." })

        const enchere = await EnchereModel.findByIdAndDelete(req.params.id)
        if (!enchere) return res.status(404).json({ message: "Désolé, aucune enchère correspondante n'a été trouvée." })
        res.send({ response: enchere, message: "Suppression de l'enchère effectuée avec succès." })
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
            console.log(reserve_price)
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

//----------return the rejected article data ----------------
exports.reject_enchere = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "L'identifiant de l'enchère est invalide." })

        const { reject_motif } = req.body

        const enchere = await EnchereModel.findById(req.params.id)
        if (!enchere) return res.status(404).json({ message: "Désolé, aucune enchère correspondante n'a été trouvée." })

        enchere.enchere_status = "rejected"
        enchere.reject_motif = reject_motif

        const enchere_after_reject = await enchere.save()
        if (!enchere_after_reject) throw "Une erreur est survenue au niveau du serveur lors du rejet l'enchère."

        res.send({ response: enchere_after_reject, message: "L'enchère a été rejetée." })
    } catch (error) {

    }
}

// controller function to handle file upload
exports.upload_files = upload.array('files', 5, (req, res) => {
    try {
        const files = req.files
        if (!files)
            throw 'Veuillez choisir des fichiers'

        res.status(200).json({ response: files, message: 'Fichier uploader avec succès', })
    } catch (error) {
        res.status(500).send({ message: error })
    }
})