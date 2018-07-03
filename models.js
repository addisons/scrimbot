const config = require("./config.json");
const mongoose = require('mongoose');
const bugs = require('./models/bugs');
const settings = require('./models/settings');
mongoose.connect(encodeURI(config.mongoURI));

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function() {
    console.log('Connected to MongoDB.');
});

var setts = mongoose.model('settings', settings.settingSchema);

var bug = mongoose.model("bug", bugs.bugSchema);
var setting = mongoose.model("settings", settings.settingSchema);

module.exports.bug = bug;
module.exports.setting = setting;