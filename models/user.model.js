const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const user_sch = new mongoose.Schema({
    name: { type: String, trim: true },
    phone: { type: String, trim: true, unique: true, required: true },
    email: { type: String, trim: true },
    town: { type: String, trim: true },
    image: { type: String },
    password: { type: String, trim: true, required: true, minlength: 6 },
    facebook: { id: String, first_name: String, last_name: String, picture_url: String },
    vip: { type: Boolean, default: false },
    invitations: [String],
    forgot_password_token: { type: String },
    trash: { type: Boolean, default: false },
    notification_token: { type: String },
    rejected: { type: Boolean, default: false },
    tmp: {
        enchereID: { type: mongoose.Types.ObjectId, ref: "Enchere" },
        montant: { type: Number },
        reserve_price: { type: Boolean },
        date: { type: Number }
    },
    admin: { type: Boolean, default: false }
}, { timestamps: true })



const UserModel = mongoose.model("User", user_sch)

module.exports = UserModel