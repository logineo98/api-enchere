const admin = require("firebase-admin");

exports.send_notification = (req, res) => {

    const { title, body, imageUrl, to, data } = req.body

    const message = { notification: { title, body, imageUrl }, token: to, data }

    admin.messaging().send(message)
        .then(resp => res.send({ response: resp }))
        .catch(error => res.status(500).json({ message: error }))
}


exports.send_notif_func = (title, body, imageUrl, to, data) => {

    let message = null
    if (imageUrl === "")
        message = { notification: { title, body }, token: to, data: data ? data : {} }
    else
        if (data === null)
            message = { notification: { title, body, imageUrl }, token: to }
        else
            if (imageUrl === "" && data === null)
                message = { notification: { title, body }, token: to }
            else
                message = { notification: { title, body, imageUrl }, token: to, data }

    return admin.messaging().send(message).then(res => res).catch(err => console.log(err))
}