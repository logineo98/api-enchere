const mongoose = require('mongoose')

const enchere_sch = new mongoose.Schema({
    sellerID: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    categories: [{ type: String, required: true }],
    medias: [String],
    started_price: { type: Number, required: true },
    increase_price: { type: Number, required: true },
    increase_suggestion_price: { type: [Number], default: [1, 2, 3] },
    reserve_price: { type: Number },
    expiration_time: { type: Date, required: true },
    enchere_type: { type: String, enum: ["public", "private"], default: "public" },
    enchere_status: { type: String, enum: ["published", "pending", "rejected", "closed"], default: "pending" },
    reject_motif: { type: String, trim: true },
    delivery_options: { teliman: { type: Boolean }, own: { type: Boolean }, cost: { type: Boolean }, deliveryPrice: { type: Number } },
    history: [{
        buyerID: { type: mongoose.Types.ObjectId, ref: "User", required: true },
        montant: { type: Number, required: true },
        reserve_price: { type: Boolean, default: false },
        date: { type: Number, default: new Date().getTime() }
    }],
    likes: [{ type: mongoose.Types.ObjectId, ref: "User", required: true }],
    trash: { type: Boolean, default: false }
}, { timestamps: true })

const EnchereModel = mongoose.model("Enchere", enchere_sch)
module.exports = EnchereModel