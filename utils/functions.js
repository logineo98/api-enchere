const licenseKey = require("license-key-gen");
const nodemailer = require("nodemailer");
const Generator = require("license-key-generator");
const { Vonage } = require('@vonage/server-sdk');
const twilio = require('twilio');

exports.sendEmail = (auth, subject, text, from, to) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: auth,
    });

    const mailOptions = {
        from: from,
        to: to,
        subject: subject,
        text: text,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error occurred while sending the email: " + error.message);
        } else {
            console.log("Email sent successfully: " + info.response);
        }
    });
};

exports.compareTwoArray = (tableau1, tableau2) => {
    for (let i = 0; i < tableau1.length; i++)
        if (tableau2.includes(tableau1[i])) return true;
    return false;
};

exports.isEmpty = (value) => value === undefined || value === null || (typeof value === "object" && Object.keys(value).length === 0) || (typeof value === "string" && value.trim().length === 0);

exports.isEqual = (value1, value2) => {
    // Vérifier le type des valeurs
    if (typeof value1 !== typeof value2) {
        return false;
    }

    // Vérifier si les deux valeurs sont des tableaux
    if (Array.isArray(value1) && Array.isArray(value2)) {
        // Vérifier si les deux tableaux ont la même longueur
        if (value1.length !== value2.length) {
            return false;
        }

        // Comparer chaque élément des tableaux
        return value1.every((value, index) => isEqual(value, value2[index]));
    }

    // Vérifier si les deux valeurs sont des objets
    if (typeof value1 === 'object' && typeof value2 === 'object') {
        // Vérifier si les deux objets ont la même quantité de propriétés
        if (Object.keys(value1).length !== Object.keys(value2).length) {
            return false;
        }

        // Comparer chaque propriété des objets
        for (let prop in value1) {
            if (!isEqual(value1[prop], value2[prop])) {
                return false;
            }
        }

        // Si toutes les propriétés sont égales, les objets sont égaux
        return true;
    }

    // Comparer les valeurs directement
    return value1 === value2;
}


exports.genLicenseKey = (user) => {
    var licenseData = { info: user, prodCode: "LEN100120", appVersion: "1.5", osType: "IOS8" }

    const key = licenseKey.createLicense(licenseData);
    return key.license;
}

//to use this function
// const cle=key(16,4)
//cle.get((error,code)=> if(!error) console.log(code))
exports.genKey = (length, group) => {
    const options = {
        type: "random", // default "random"
        length: length || 16, // default 16
        group: group || 4, // default 4
        split: "-", // default "-"
        splitStatus: true // default true
    }
    const code = new Generator(options);

    return code;
}


exports.genRandomNums = (size) => {
    let min = Math.pow(10, size - 1);
    let max = Math.pow(10, size) - 1;
    let token = Math.floor(min + Math.random() * (max - min + 1));
    return token.toString();
}

//use of function 
//const resp = sendSMS("0022379364385", "0022379364385", "message test for sms")
exports.sendSMS = async (from, to, message) => {
    try {
        const vonage = new Vonage({ apiKey: process.env.VONAGE_API_KEY, apiSecret: process.env.VONAGE_API_SECRET });
        const ans = await vonage.sms.send({ to, from, text: message });
        return ans;
    } catch (error) {
        return error;
    }
}

// Function to send SMS using Twilio
exports.sendSMSTwilio = async (toNumber, message) => {
    const accountSid = 'AC517c6b441a2e73f9578da69db46d3204';
    const authToken = '0cafbb46ec16500e3be994b79d54ada2';
    const fromNumber = '+13203011002';

    const client = twilio(accountSid, authToken);

    try {
        const response = await client.messages.create({ body: message, from: fromNumber, to: toNumber });
        return response
    } catch (error) {
        console.error(`Error sending SMS: ${error.message}`);
    }
}

exports.convertOctetsToMo = (octets) => {
    const megaoctets = octets / (1024 * 1024)
    return megaoctets.toFixed(0) + ' Mo'
}

exports.removePhoneIndicatif = (numero) => {
    var indicatif1 = "+223";
    var indicatif2 = "00223";
    if (numero.startsWith(indicatif1)) {
        return numero.slice(indicatif1.length);
    } else if (numero.startsWith(indicatif2))
        return numero.slice(indicatif2.length);
    else {
        return numero;
    }
}


exports.addPhoneIndicatif = (numero) => {
    var indicatif1 = "+223";
    var indicatif2 = "00223";
    if (!numero.startsWith(indicatif1) || !numero.startsWith(indicatif2))
        return indicatif1 + numero;
    else
        return numero;
}