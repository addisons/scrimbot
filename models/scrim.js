const mongoose = require("mongoose");

const scrimSchema = mongoose.Schema({
    serverid: String,
    date: String,
    time: String,
    team: String,
    roster: {}
}, {
    versionKey: false
});

module.exports = mongoose.model('Scrim', scrimSchema);