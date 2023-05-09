const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const user_sch = new mongoose.Schema({
    phone: { type: String, trim: true, unique: true, required: true },
    email: { type: String, trim: true },
    town: { type: String, trim: true },
    password: { type: String, trim: true, required: true, minlength: 6 },
    facebook: { id: String, first_name: String, last_name: String, picture_url: String },
    confirm_facebook_later: { type: Boolean, default: false },
    vip: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
    invitations: [String],
    licenseKey: { type: String },
    license_status: { type: Boolean, default: false },
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

// // play function before save into display: 'block',
// user_sch.pre("save", async function (next) {
//     const salt = await bcrypt.genSalt()
//     this.password = await bcrypt.hash(this.password, salt)
//     next()
// })

const UserModel = mongoose.model("User", user_sch)

module.exports = UserModel