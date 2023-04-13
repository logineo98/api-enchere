require("dotenv").config({ path: "./config/.env" })
const express = require("express")
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const { upload_files_constants } = require("./utils/constants")
require("./config/db")
const app = express()

app.use("/api/public", express.static(path.join(__dirname, "public")))
app.use(bodyParser.json())
app.use(cors())



//use of routers here
app.use("/api/user", require("./routes/user.route"))
app.use("/api/enchere", require("./routes/enchere.route"))

//upload files error handler
app.use((err, req, res, next) => {
    // console.log(err)
    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).send({ message: `Désolé, Désolé la taille d'un fichier (image ou video) ne doit pas depasser ${upload_files_constants.MAX_SIZE}` })
    } else if (err.code === "LIMIT_FILE_COUNT") {
        res.status(400).send({ message: "Désolé, le nombre maximum de fichier autorisé est 5" })
    } else {
        res.status(400).json({ message: err.message })
    }
})

const port = process.env.PORT || 5000
app.listen(port, () =>
    console.log(`Server listening on http://localhost:${port}`)
)
