require("dotenv").config({ path: "./config/.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
require("./config/db");
const app = express();

app.use("/api/public", express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(cors());


//use of routers here



const port = process.env.PORT || 5000;
app.listen(port, () =>
    console.log(`Server listening on http://localhost:${port}`)
);
