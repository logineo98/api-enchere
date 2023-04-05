const licenseKey = require("license-key-gen");
const nodemailer = require("nodemailer");
const Generator = require("license-key-generator");


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

exports.isEmpty = (value) =>
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0);

exports.genLicenseKey = (user) => {
    var licenseData = {
        info: user,
        prodCode: "LEN100120",
        appVersion: "1.5",
        osType: "IOS8",
    };

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