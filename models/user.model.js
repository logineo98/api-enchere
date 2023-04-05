const mongoose = require('mongoose');

const user_sch = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    picture: { type: String },
    facebook: { type: String },
    vip: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
    invitations: [String],
    licenseKey: { type: String },
    license_status: { type: Boolean, default: false }
})

const UserModel = mongoose.model("User", user_sch)
module.exports = UserModel