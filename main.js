const { DateTime } = require("luxon");

const discord = require("discord.js");
const client = new discord.Client();

const config = require("./config.json");
const Core = require("./classes/core.js");
const Scrim = require("./classes/scrim.js");

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

const activity = "Made by multi ~ dev version";
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

// let scrim = new Scrim({
//     type: 'Scrim',
//     date: 'Monday 2nd of June',
//     time: '8:00pm - 9:00pm',
//     opponent: 'Mad Dogz',
//     scout1: 'multi',
//     scout2: 'signed',
//     pocket: 'kpc',
//     roamer: 'keller',
//     demoman: 'not signed',
//     medic: 'Left'
// });

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

    // ~setupcore @multi @multi @ScrimBotDev @ScrimBotDev @ScrimBotDev @multi


    if (command === "clearall") {
        Roster.findOneAndRemove(search, function(err) {
            if (err) return handleError(err);
        });

        ScrimDB.remove(search, function(err) {
            if (err) return handleError(err);
        });

        message.channel.send("Cleared successfully.");
    }

    // ######################### //
    // CORE ROSTER FUNCTIONALITY //
    // ######################### //

    // Clears the database entry
    if (command === "clearcore") {
        Roster.findOneAndRemove(search, function(err) {
            if (err) return handleError(err);
        });
        message.channel.send("Cleared successfully.");
    }

    // Sets up the database entry
    if (command === "setupcore") {
        if (args.length !== 6) {
            message.channel.send("Usage:");
            message.channel.send("~setupcore @scout1 @scout2 @pocket @roamer @demoman @medic");
            return;
        }

        var roster = {
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
    }

    // Adjusts a role
    if (command === "adjustcore" || command === "coreadjust") {
        if (args.length !== 2) {
            message.channel.send("Incorrect input.");
        }

        else {
            var role = args[0];

            if (ROLES.indexOf(role) === -1) {
                message.channel.send("Role does not exist.");
                return;
            }

            var player = getID(args[1]);

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
        }
    }

    // Returns the core roster
    if (command === "core") {

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

    }

    // ################### //
    // SCRIM FUNCTIONALITY //
    // ################### //


    // Clears the database entry
    if (command === "clearscrims") {
        ScrimDB.remove(search, function(err) {
            if (err) return handleError(err);
        });
        message.channel.send("Cleared successfully.");
    }

    // Usage: ~setscrim [date] [time] [opponent]
    if (command === "setscrim") {
        if (args.length < 3) {
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
    }

    if (command === "scrims") {
        ScrimDB.find(search, function(err, docs) {
            if (docs.length === 0) {
                message.channel.send("You have no scrims.");
                return;
            }

            // console.log(docs);

            fields = [];

            for (var i = 0; i < docs.length; i++) {
                fields.push((new Scrim(docs[i])).getFieldShort);
            }

            message.channel.send({embed: {fields: fields}});

            // message.channel.send(docs);
        });
    }

    if (command === "time") {
        // var birthday = new Date(Date.now());
        // var date1 = birthday.toString();
        //
        // console.log(date1);
        // console.log(birthday.getTimezoneOffset());

        var test = DateTime.fromFormat("2018-07-03T20:00 Australia/Adelaide", "yyyy-MM-dd'T'HH:mm z");
        // var test = DateTime.fromFormat("July 3, 2018 at 20:00 UTC+7", "LLLL d, yyyy 'at' H:m z");
        console.log(test.toString());
    }

    if (command === "mode") {

        if (args.length > 0) {
            if (modes.indexOf(args[0]) !== -1) {
                sett.mode = args[0];
                message.channel.send(`Mode set to ${sett.mode}.`);
            }

            else if (args[0] === "reset") {
                sett.mode = null;
                message.channel.send("Mode reset.");
            }

            else {
                message.channel.send("Invalid mode.");
            }
        }

        else {
            if (sett.mode !== null) {
                message.channel.send(`The current mode is ${sett.mode}.`);
            }

            else {
                message.channel.send(`No mode set.`);
            }
        }
    }

    // if (command === "help") {
    //     const m = message.channel.send({embed: {
    //             color: 3447003,
    //             author: client.user.username,
    //             title: "# This is an embed",
    //             url: "http://google.com",
    //             description: "This is a test embed to showcase what they look like and what they can do.",
    //             fields: [{
    //                 name: "Fields",
    //                 value: "They can have different fields with small headlines."
    //             },
    //                 {
    //                     name: "Masked links",
    //                     value: "You can put [masked links](http://google.com) inside of rich embeds."
    //                 },
    //                 {
    //                     name: "Markdown",
    //                     value: "You can put all the *usual* **__Markdown__** inside of them."
    //                 }
    //             ],
    //             timestamp: new Date(),
    //             footer: {
    //                 icon_url: client.user.avatarURL,
    //                 text: "© Example"
    //             }
    //         }});
    // }

    if(command === "purge") {
        // This command removes all messages from all users in the channel, up to 100.

        // get the delete count, as an actual number.
        const deleteCount = parseInt(args[0], 10);

        // Ooooh nice, combined conditions. <3
        if(!deleteCount || deleteCount < 2 || deleteCount > 100)
            return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");

        // So we get our messages, and delete them. Simple enough, right?
        const fetched = await message.channel.fetchMessages({limit: deleteCount});
        message.channel.bulkDelete(fetched)
            .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
    }
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