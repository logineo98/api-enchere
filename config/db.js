const mongoose = require("mongoose")
const url = process.env.DATABASE_URL

mongoose.connect(url, {})
    .then(() => {
        console.log("Connected to mongoDB")
    })
    .catch(error => {
        console.log("Failed to connect MongoDB", { error })
    })