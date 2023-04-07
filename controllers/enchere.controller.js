const { upload } = require("../middleware/middleware");
const EnchereModel = require("../models/enchere.model");

exports.create_enchere = async (req, res) => {
    try {

        const enchere = new EnchereModel(req.body)
        const saved_data = await enchere.save()
        res.status(200).send({ response: saved_data, message: "Article mis en enchere avec succès mais en état d'attente; patienter le temps que nous verifions la conformité de l'article avant de le mettre en enchère. Merci" })
    } catch (error) {
        res.status(500).send({ message: error });
    }

}

exports.get_enchere = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.get_all_encheres = async (req, res) => {
    try {

    } catch (error) {

        res.status(500).send({ message: error.message });
    }

}

exports.update_enchere = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.delete_enchere = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}

exports.participate_in_enchere = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).send({ message: error.message });
    }

}




// controller function to handle file upload
exports.upload_files = upload.array('files', 10, (req, res) => {
    try {
        const files = req.files;
        if (!files)
            throw 'Please choose files';

        res.status(200).json({ response: files, message: 'Fichier uploader avec succès', });
    } catch (error) {
        res.status(500).send({ message: error });
    }
});