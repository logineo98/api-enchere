const { sendNotification } = require("../utils/functions")

exports.send_notification = (req, res) => {

    const { title, body, imageUrl, to, data } = req.body

    sendNotification(title, body, imageUrl ? imageUrl : "", to, data ? data : {})
        .then(() => res.send({ response: "Notification envoyée avec succès" }))
        .catch(error => res.status(500).json({ message: error }))
}