const { DateTime } = require("luxon");
const fs = require("fs");

const discord = require("discord.js");
const client = new discord.Client();

const config = require("./config.json");
const Core = require("./classes/core.js");
const Scrim = require("./classes/scrim.js");

const md = require("./js/markdown");
const NL = '\n';
const ROLES = ["scout1", "scout2", "pocket", "roamer", "demoman", "medic"];

const mongoose = require("mongoose");

mongoose.connect(encodeURI(config.mongoURI)).then(
    () => {console.log("Connected to database.")},
    err => {console.log('err', err);}
);

const Roster = require("./models/roster");
const ScrimDB = require("./models/scrim");

const activity = "Made by multi ~ " + config.version;

const modes = ['ultiduo', '4s', '6s', 'prolander', 'highlander'];

client.on("ready", () => {
    console.log('Bot ready. Running on ' + client.guilds.size + ' servers.');
    client.user.setActivity(activity);
});

client.on("guildCreate", guild => {
    console.log(`New guild joined: ${guild.name}`);
});

client.on("guildDelete", guild => {
    console.log(`Removed from guild: ${guild.name}`);
});

function cleanID(rawid) {
    return rawid.slice(2, rawid.length - 1);
}

function getNameFromID(rawid) {
    return client.users.get(cleanID(rawid)).username;
}

client.on("message", async message => {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore messages without prefix
    if (message.content[0] !== config.prefix) return;

    // Process input into a command
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const search = {serverid: message.guild.id};

    if (command === "clearall") {
        Roster.findOneAndRemove(search, function(err) {
            if (err) return handleError(err);
        });

        ScrimDB.remove(search, function(err) {
            if (err) return handleError(err);
        });

        message.channel.send("Cleared successfully.");

        return;
    }

    // ######################### //
    // CORE ROSTER FUNCTIONALITY //
    // ######################### //

    // Clears the database entry
    else if (command === "clearcore") {
        Roster.findOneAndRemove(search, function(err) {
            if (err) return handleError(err);
        });
        message.channel.send("Cleared successfully.");

        return;
    }

    // Sets up the database entry
    else if (command === "setcore") {
        if (args.length !== 6) {
            message.channel.send("Try '~commands core' for how to use this function.");
            return;
        }

        const roster = {
            scout1: {
                id: cleanID(args[0]),
                name: getNameFromID(args[0])
            },
            scout2: {
                id: cleanID(args[1]),
                name: getNameFromID(args[1])
            },
            pocket: {
                id: cleanID(args[2]),
                name: getNameFromID(args[2])
            },
            roamer: {
                id: cleanID(args[3]),
                name: getNameFromID(args[3])
            },
            demoman: {
                id: cleanID(args[4]),
                name: getNameFromID(args[4])
            },
            medic: {
                id: cleanID(args[5]),
                name: getNameFromID(args[5])
            }
        };

        Roster.count(search, function(err, count) {
            if (count > 0) {
                Roster.update(search, {
                    core: roster
                }, function(err) {
                    if (err) return handleError(err);
                    else message.channel.send("Core roster updated.");
                });
            }

            else {
                Roster.create({
                    serverid: message.guild.id,
                    core: roster
                }, function (err) {
                    if (err) return handleError(err);
                    else message.channel.send("Core roster created.");
                });
            }
        });

        return;
    }

    // Adjusts a role
    else if (command === "adjustcore") {
        if (args.length !== 2) {
            message.channel.send("Try '~commands core' for how to use this function.");
            return;
        }

        const role = args[0];

        if (ROLES.indexOf(role) === -1) {
            message.channel.send("Role does not exist.");
            return;
        }

        const player = getNameFromID(args[1]);

        Roster.count(search, function(err, count) {
            if (count > 0) {
                field = "core." + role;

                Roster.update(search, {
                   [field] : player
                }, function(err) {
                    if (err) return handleError(err);
                    else message.channel.send("Core roster updated.");
                });
            }

            else message.channel.send("Your core roster has not been setup.");

        });

        return;
    }

    // Returns the core roster
    else if (command === "core") {

        Roster.count(search, function(err, count) {
           if (count > 0) {
               Roster.findOne(search, function(err, roster) {
                   if (err) return handleError(err);
                   else message.channel.send((new Core(roster.core)).getString);
               });
           }

           else {
               message.channel.send("Your core roster has not been setup.");
           }
        });

        return;

    }

    // ################### //
    // SCRIM FUNCTIONALITY //
    // ################### //


    // Clears the database entry
    else if (command === "clearscrims") {
        ScrimDB.remove(search, function(err) {
            if (err) return handleError(err);
        });

        message.channel.send("Cleared successfully.");

        return;
    }

    // Usage: ~setscrim [date] [time] [opponent]
    else if (command === "setscrim") {
        if (args.length < 3) {
            message.channel.send("Try '~commands scrim' for how to use this function.");
            return;
        }

        Roster.count(search, function(err, count) {
            if (count > 0) {
                Roster.findOne(search, function(err, roster) {
                    if (err) return handleError(err);
                    else {
                        ScrimDB.create({
                            serverid: message.guild.id,
                            date: args[0],
                            time: args[1],
                            team: args.slice(2).join(" "),
                            roster: (new Core(roster.core)).getDictionary
                        }, function (err) {
                            if (err) return handleError(err);
                            else message.channel.send("Scrim created.");
                        });
                    }
                });
            }

            else {
                message.channel.send("Your core roster has not been setup.");
                return;
            }
        });

        return;
    }

    else if (command === "scrims") {
        ScrimDB.find(search, function(err, docs) {
            if (docs.length === 0) {
                message.channel.send("You have no scrims.");
                return;
            };

            fields = [];

            for (var i = 0; i < docs.length; i++) {
                fields.push((new Scrim(docs[i])).getFieldShort);
            }

            message.channel.send({embed: {
                color: config.embedColour,
                fields: fields
            }});
        });

        return;
    }

    else if (command === "myscrims") {
        ScrimDB.find(search, function(err, docs) {
            if (docs.length === 0) {
                message.channel.send("You have no scrims.");
                return;
            };

            fields = [];

            for (var i = 0; i < docs.length; i++) {
                for (key in docs[i].roster) {
                    if (docs[i].roster[key].id === message.author.id) {
                        fields.push((new Scrim(docs[i])).getFieldShort);
                    }

                    break;
                }
            }

            message.channel.send({embed: {
                color: config.embedColour,
                fields: fields}
            });
        });

        return;
    }

    else if (command === "commands") {
        if (args.length === 0) {
            message.channel.send({embed: {
                color: config.embedColour,
                title: "Commands",
                description: md.b("Note:") + " All functionality is in development phases." + NL
                    + "To report a bug, join https://discord.gg/FBTrRnz.",
                fields: [{
                    name: "~commands core",
                    value: "Functions related to your core roster."
                }, {
                    name: "~commands general",
                    value: "General functions."
                }, {
                    name: "~commands scrims",
                    value: "Functions related to scrims."
                }]

            }});

            return;
        }

        if (args[0] === "core") {
            message.channel.send({embed: {
                color: config.embedColour,
                title: "Commands - Core Roster",
                description: md.i(md.b("~adjustcore") + " role @player") + NL
                    + 'Allows you to change a player in your roster.' + NL + NL
                    + 'Example: ' + md.i("~adjustcore demoman @termo") + NL + NL

                    + md.i(md.b("~clearcore")) + NL
                    + "Clears your core roster." + NL + NL

                    + md.i(md.b("~core")) + NL
                    + "Prints out the core roster." + NL + NL

                    + md.i(md.b("~setupcore") + " @scout1 @scout2 @pocket @roamer @demoman @medic") + NL
                    + 'Allows you to setup your core team using Discord mentions.' + NL + NL
                    + 'Example: ' + md.i("~setupcore @sheep @antwa @yuki @aporia @bulk @bonobo")
            }});
        }

        else if (args[0] === "general") {
            message.channel.send({embed: {
                color: config.embedColour,
                title: "Commands - General",
                description: md.i(md.b("~clearall")) + NL
                + "Clears both the roster and all scrims." + NL + NL

                + md.i(md.b("~version") + " (major|minor)") + NL
                + "Gets the raw changelog for the latest major/minor release version." + NL + NL
                + "Example: " + md.i("~version major") + NL + NL

                + md.i(md.b("~version") + " versionid") + NL
                + "Gets the raw changelog for a particular release version." + NL + NL
                + "Example: " + md.i("~version v0.1.6")
            }});
        }

        else if (args[0] === "scrims") {
            message.channel.send({embed: {
                color: config.embedColour,
                title: "Commands - Scrims",
                description: md.i(md.b("~clearscrims")) + NL
                + "Clears all scrims." + NL + NL

                + md.i(md.b("~setscrim") + " date time opponent") + NL
                + 'Allows you to setup a scrim.' + NL + NL
                + 'Example: ' + md.i("~setscrim Thursday 8pm Mad Dogz") + NL + NL

                + md.i(md.b("~scrims")) + NL
                + "Prints out all the scrims."
            }});
        }

        else {
            message.channel.send("Command set not found.")
        }

        return;
    }

    else if (command === "version") {
        if (args.length !== 1) {
            message.channel.send("Try '~commands general' for how to use this function.");
            return;
        }

        const inp = args[0];

        if (inp !== "major" && inp !== "minor" && !/^v([0-9]{1,2}).([0-9]{1,2}).([0-9]{1,2})$/.test(inp)) {
            message.channel.send("Try '~commands general' for how to use this function.");
            return;
        }

        fs.readFile("CHANGELOG.md", function(err, data) {
            if (err) throw err;
            else {
                const changelog = data.toString().split('\n');

                var getPatch = false;
                var out = '';

                for (var i = 0; i < changelog.length; i++) {

                    if (getPatch)  {
                        if (changelog[i] !== '') {
                            out += changelog[i] + NL;
                        }

                        else break;
                    }

                    else {
                        switch (inp) {
                            case "major":
                                if (changelog[i].indexOf("## v") !== -1) {
                                    out += changelog[i] + NL;
                                    getPatch = true;
                                }

                                break;

                            case "minor":
                                if (changelog[i].indexOf("#### v") !== -1) {
                                    out += changelog[i] + NL;
                                    getPatch = true;
                                }

                                break;

                            default:
                                if (changelog[i].indexOf("## " + inp) !== -1) {
                                    out += changelog[i] + NL;
                                    getPatch = true;
                                }
                        }

                    }
                }

                if (!out) message.channel.send("Patch not found.");
                else message.channel.send(out);
            }
        });

        return;
    }

    else message.channel.send("Unknown command, try '~commands' for some help!");
});

client.login(config.maintoken);