const mongoose = require("mongoose");

const settingSchema = mongoose.Schema({
    serverid: String,
    mode: String
}, {
    versionKey: false
});

module.exports = mongoose.model('Setting', settingSchema);