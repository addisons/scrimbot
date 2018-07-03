const { DateTime } = require("luxon");

const discord = require("discord.js");
const client = new discord.Client();

const config = require("./config.json");
const Core = require("./classes/core.js");
const Scrim = require("./classes/scrim.js");

const md = require("./js/markdown");
const NL = '\n';

const YES = '✅';
const NO = '❌';

const ROLES = ["scout1", "scout2", "pocket", "roamer", "demoman", "medic"];

var mongoose = require("mongoose");

mongoose.connect(encodeURI(config.mongoURI)).then(
    () => {console.log("Connected.")},
    err => {console.log('err', err);}
);

const Roster = require("./models/roster");
const ScrimDB = require("./models/scrim");

// const models = require("./models");

const activity = "Made by multi ~ " + config.version;
const valid = ["scrims", "general"];

const modes = ['ultiduo', '4s', '6s', 'prolander', 'highlander'];

client.on("ready", () => {
    console.log('Bot has started.');
    client.user.setActivity(activity);
});

client.on("guildCreate", guild => {
    console.log('New guild joined: ${guild.name}');
});

client.on("guildDelete", guild => {
    console.log(`Removed from guild: ${guild.name}`);
});

function getID(argument) {
    var id = argument.slice(2, argument.length - 1);
    return client.users.get(id).username;
}

client.on("message", async message => {
    // Ignore bots
    if (message.author.bot) return;

    // Ignore messages without prefix
    if (message.content[0] !== config.prefix) return;

    // Ignore messages in invalid channels
    if (valid.indexOf(message.channel.name) === -1) return;

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
            scout1: getID(args[0]),
            scout2: getID(args[1]),
            pocket: getID(args[2]),
            roamer: getID(args[3]),
            demoman: getID(args[4]),
            medic: getID(args[5])
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

        const player = getID(args[1]);

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

            message.channel.send({embed: {fields: fields}});
        });

        return;
    }

    else if (command === "time") {
        // var birthday = new Date(Date.now());
        // var date1 = birthday.toString();
        //
        // console.log(date1);
        // console.log(birthday.getTimezoneOffset());

        var test = DateTime.fromFormat("2018-07-03T20:00 Australia/Adelaide", "yyyy-MM-dd'T'HH:mm z");
        // var test = DateTime.fromFormat("July 3, 2018 at 20:00 UTC+7", "LLLL d, yyyy 'at' H:m z");
        console.log(test.toString());

        return;
    }

    else if (command === "commands") {
        if (args.length === 0) {
            message.channel.send({embed: {
                color: config.embedColour,
                title: "Commands",
                description: md.b("Note:") + " All functionality is in development phases." + NL
                    + "Please report any bugs or issues to " + config.multiID + ".",
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
                + "Clears both the roster and all scrims."
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

    else if (command === "clear") {
        message.channel.bulkDelete(100);
        return;
    }

    else message.channel.send("Unknown command, try '~commands' for some help!");
});

client.on('messageReactionAdd', (reaction, user) => {
    var message = reaction.message;
    // console.log(message.guild.members.get(message.author.id).roles.exists('name','Core'));

    message.channel.fetchMessage(message.id).then(messagea => {
        rows = messagea.embeds[0].fields[0].value.split('\n');

        var i = 0;

        while (i < rows.length) {
            if (!rows[i].includes(':')) {
                rows.splice(i, 1);
                continue;
            }

            i++;
        }

        rows.splice(0, 1);

        for (row in rows) {
            rows[row] = rows[row].split(": ");
        }

        console.log(messagea);

        embed = {embed: {
            fields: [{
                name: 'Matches',
                value: '**Scrim against Mad Dogz**' +
                '\nMon 2nd of July' +
                '\n8:00pm - 9:00pm' +
                '\n\nScout: **sheep**' +
                '\nScout: **antwa?**' +
                '\nPocket: **yuki**' +
                '\nRoamer: *aporia?*' +
                '\nDemoman: *termo?*' +
                '\nMedic: *bonobo?*'
            }]
        }};

        messagea.edit(embed);
        messagea.clearReactions();

        if (reaction.emoji.name === YES) {
            rows[1][1] = '*' + rows[1][1] + '*';
        }

        else if (reaction.emoji.name === NO) {
            messagea.edit("You reacted no.");
        }

        else {
            messagea.edit(`I don't know what ${reaction.emoji.name} is.`)
        }
    });

    // console.log(message.content);

    // users = Array.from(reaction.users.values());
    //
    // for (var i = 0; i < users.length; i++) {
    //     console.log(users[i]);
    // }
});

// client.on('messageReactionAdd', (reaction, user) => {
//
//     if(reaction.emoji.name === ":white_check_mark:") {
//         console.log(reaction.users);
//     }
//     else
//     {
//         console.log(reaction.emoji.name);
//     }
// });

client.login(config.token);