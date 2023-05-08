const admin = require("firebase-admin");

exports.send_notification = (req, res) => {

    const { title, body, imageUrl, to, data } = req.body

    const message = { notification: { title, body, imageUrl }, token: to, data }

    admin.messaging().send(message)
        .then(resp => res.send({ response: resp }))
        .catch(error => res.status(500).json({ message: error }))
}