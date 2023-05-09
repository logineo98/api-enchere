require("dotenv").config({ path: "./config/.env" })
const express = require("express")
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const { upload_files_constants } = require("./utils/constants")
const { convertOctetsToMo } = require("./utils/functions")
const admin = require("firebase-admin")
const serviceAccount = require("./serviceAccountKey.json")
require("./config/db")

const app = express()

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

app.use("/api/public", express.static(path.join(__dirname, "public")))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())


//use of routers here
app.use("/api/user", require("./routes/user.route"))
app.use("/api/enchere", require("./routes/enchere.route"))
app.use("/api/notification", require("./routes/notification.route"))
app.use("/api/vitepay", require("./routes/vitepay.route"))

//upload files error handler
app.use((err, req, res, next) => {
    // console.log(err)
    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).send({ message: `Désolé, Désolé la taille d'un fichier (image ou video) ne doit pas depasser ${convertOctetsToMo(upload_files_constants.MAX_SIZE)}` })
    } else if (err.code === "LIMIT_FILE_COUNT") {
        res.status(400).send({ message: "Désolé, le nombre maximum de fichier autorisé est 5" })
    } else if (err.code === "ENOENT" && err.syscall === "unlink" && err.errno === -4058) {
        res.status(400).send({ message: "Le fichier n'a pas été trouvé pour être supprimé." })
    } else {
        res.status(400).json({ message: err.message })
    }
})

const port = process.env.PORT || 5000
app.listen(port, () =>
    console.log(`Listening on port ${port}`)
)
