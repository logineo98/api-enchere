require("dotenv").config({ path: "./config/.env" })
const express = require("express")
const cors = require("cors")
const path = require("path")
const bodyParser = require("body-parser")
const { upload_files_validation } = require("./utils/validations")
const multer = require("multer")
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
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({ message: 'La taille du fichier est trop importante.' });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            res.status(400).json({ message: 'Le nombre maximum de fichier autorisé est: 5 fichiers' });
        } else {
            next(err);
        }
    } else if (err instanceof Error) {
        if (err.message === 'la taille de l\'image est trop importante' || err.message === 'la taille de la vidéo est trop importante' || err.message === ' seuls les fichiers JPEG, PNG, MP4 et MOV sont autorisés') {
            res.status(400).json({ message: err.message });
        } else {
            res.status(500).json({ message: err.message || 'Une erreur est survenue.' });
        }
    } else {
        next(err);
    }

})

const port = process.env.PORT || 5000
app.listen(port, () =>
    console.log(`Server listening on http://localhost:${port}`)
)
