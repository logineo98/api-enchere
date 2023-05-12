const admin = require("firebase-admin");
const UserModel = require("../models/user.model");

exports.send_notification = (req, res) => {

    const { title, body, to, data } = req.body

    let message = null

    if (!data)
        message = { notification: { title, body }, token: to }
    else
        message = { notification: { title, body }, token: to, data }

    // const message = { notification: { title, body, imageUrl }, token: to, data }

    // if (title !== "" || body !== "")
    //     UserModel.findOne({ notification_token: to })
    //         .select('-password')
    //         .then(user => user.updateOne({ $push: { notifications: { title, body, data, date: new Date().getTime() } } }))
    //         .catch(error => res.status(500).json({ message: error }))


    admin.messaging().send(message)
        .then(resp => res.send({ response: resp }))
        .catch(error => res.status(500).json({ message: error }))
}


exports.send_notif_func = async (title, body, to, data) => {
    try {
        let message = null
        if (data === null)
            message = { notification: { title, body }, token: to }
        else
            message = { notification: { title, body }, token: to, data }

        return await admin.messaging().send(message)
    } catch (error) {
        console.log(error.message)
    }
}