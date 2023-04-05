const UserModel = require("../models/user.model");
const { isEmpty } = require("./functions");


exports.login_validation = async (req, res, next) => {
    try {
        let errors;
        const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const { email, password } = req.body

        const user = await UserModel.findOne({ email })

        if (email && !regexEmail.test(email)) errors = "Format e-mail incorrect.";
        if (isEmpty(email)) errors = "Email ou mot de passe incorrect.";
        if (!isEmpty(user)) errors = "Cet email est déjà utilisé."
        if (isEmpty(password)) errors = "Email ou mot de passe incorrect.";
        if (password.length < 6) errors = "Mot de passe trop court."

        req.error = errors;
        next()
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}