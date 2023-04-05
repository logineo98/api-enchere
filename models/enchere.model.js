const mongoose = require('mongoose');

const enchere_sch = new mongoose.Schema({
    sellerID: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, required: true },
    categories: [String],
    medias: [String],
    started_price: { type: Number, required: true },
    increase_price: { type: Number, required: true },
    increase_suggestion_price: { type: [Number], default: [1, 2, 3] },
    reserve_price: { type: Number },
    expiration_time: { type: Date, required: true },
    enchere_type: { type: String, enum: ["public", "privée"], default: "public" },
    history: [{
        buyerID: { type: mongoose.Types.ObjectId, ref: "User", required: true },
        montant: { type: Number, required: true },
    }],
}, { timestamps: true });
const EnchereModel = mongoose.model("Enchere", enchere_sch);
module.exports = EnchereModel;