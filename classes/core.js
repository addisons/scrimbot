const md = require("../js/markdown");
const NL = '\n';

class Core {
    constructor(d) {
        this.scout1 = d["scout1"];
        this.scout2 = d["scout2"];
        this.pocket = d["pocket"];
        this.roamer = d["roamer"];
        this.demoman = d["demoman"];
        this.medic = d["medic"];
    }

    get getDictionary() {
        return this.toDictionary();
    }

    get getString() {
        return this.toString();
    }

    toDictionary() {
        return {
            scout1: this.scout1,
            scout2: this.scout2,
            pocket: this.pocket,
            roamer: this.roamer,
            demoman: this.demoman,
            medic: this.medic
        };
    }

    toString() {
        return {
            embed: {
                description: md.u("Core Roster") + NL + NL
                + 'Scout1: ' + this.scout1 + NL
                + 'Scout2: ' + this.scout2 + NL
                + 'Pocket: ' + this.pocket + NL
                + 'Roamer: ' + this.roamer + NL
                + 'Demoman: ' + this.demoman + NL
                + 'Medic: ' + this.medic
            }
        };
    }



}

module.exports = Core;