function b(s) {
    return "**" + s + "**";
}

function i(s) {
    return "*" + s + "*";
}

function s(s) {
    return "~~" + s + "~~";
}

function u(s) {
    return "__" + s + "__";
}

const NL = '\n';

class Scrim {
    constructor(d) {
        this.title = "Scrim against " + d["team"];
        this.date = d["date"];
        this.time = d["time"];
        this.scout1 = d.roster["scout1"];
        this.scout2 = d.roster["scout2"];
        this.pocket = d.roster["pocket"];
        this.roamer = d.roster["roamer"];
        this.demoman = d.roster["demoman"];
        this.medic = d.roster["medic"];
    }

    get getField() {
        return this.toField();
    }

    get getFieldShort() {
        return this.toFieldShort();
    }

    get getString() {
        return this.toString();
    }

    get getStrShort() {
        return this.toStrShort();
    }

    toField() {
        return {
            name: b(this.title),
            value: this.date + + ' ' + this.time + NL + NL
            + 'Scout: ' + b(this.scout1) + NL
            + 'Scout: ' + i(this.scout2) + NL
            + 'Pocket: ' + i(this.pocket) + NL
            + 'Roamer: ' + i(this.roamer) + NL
            + 'Demoman: ' + i(this.demoman) + NL
            + 'Medic: ' + i(this.medic)
        };
    }

    toFieldShort() {
        return {
            name: b(this.title),
            value: this.date + ' ' + this.time
        };
    }

    toString() {
        return {
            embed: {
                description: b(this.title) + NL
                + this.date + NL
                + this.time + NL + NL
                + 'Scout: ' + b(this.scout1) + NL
                + 'Scout: ' + i(this.scout2) + NL
                + 'Pocket: ' + i(this.pocket) + NL
                + 'Roamer: ' + i(this.roamer) + NL
                + 'Demoman: ' + i(this.demoman) + NL
                + 'Medic: ' + i(this.medic),
                footer: {
                    text: "Unsure what all this means? Type '~help scrim' to find out more."
                }
            }
        };
    }

    toStrShort() {
        return {
            embed: {
                description: b(this.title) + NL
                + this.date + ' ' + this.time
            }
        };
    }



}

module.exports = Scrim;

