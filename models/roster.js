const mongoose = require("mongoose");

const rosterSchema = mongoose.Schema({
    serverid: String,
    core: {}
}, {
    versionKey: false
});

module.exports = mongoose.model('Roster', rosterSchema);