exports.regex = {
    phone: /(^(\+223|00223)?[5-9]{1}[0-9]{7}$)/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
}

exports.constants = {
    sms_sender_number: "22373030732"
}

exports.upload_files_constants = {
    MAX_FILES_LENGTH: 5,
    FILES_ALLOW_TYPES: ['image/jpeg', 'image/png', 'video/mp4', 'video/avi'],//to be extend later
    MAX_SIZE: 50 * 1024 * 1024, //50M
}