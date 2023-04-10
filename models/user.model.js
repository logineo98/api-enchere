const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const user_sch = new mongoose.Schema({
    name: { type: String },
    phone: { type: String, trim: true, unique: true, required: true },
    email: { type: String, trim: true },
    password: { type: String, trim: true, required: true, minlength: 6 },
    picture: { type: String },
    facebook: { type: String },
    vip: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
    invitations: [String],
    licenseKey: { type: String },
    license_status: { type: Boolean, default: false },
    forgot_password_token: { type: String },
    trash:{type:Boolean,default:false}
}, { timestamps: true })

// play function before save into display: 'block',
user_sch.pre("save", async function (next) {
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

const UserModel = mongoose.model("User", user_sch)

module.exports = UserModel