// CONFIG

const FT = {


// ---- GENERAL ----

//how many each of these fields accepts maximum
    caps: {
        mutations:  3,
        companions: 3,
        accessories: 2,
        items:      1,
        flee_items: 1,
        race_items: 1,
    },

//this makes the tool bypass phrases like 'n/a' or 'none' for "empty" fields
    placeholder_patterns: /^\(.*\)$|^n\/?a$|^none$|^remove|^tbd$|^-$/i,

//splits pasted form text into lines by inserting a line break before each known field name and checks what to identify as a field id
    field_names: [
        "Age:", "Size:", "Build:",
        "Offensive Battle Accessory:", "Defensive Battle Accessory:",
        "Racing Accessory:",
        "Companion", "Mutation",
        "Skills:", "Specialty:", "Item:", "Items:",
        "Disability:", "Debuff:", "Debuffs:", "Injury:",
    ],


// ---- FIGHT ----

    //fight variables: ATK, DEF, AGI, PER, TOTAL

    sizes: {
        "Toy":           { AGI: 10 },
        "Extra small":   { AGI: 10 },
        "Small":         { AGI: 5 },
        "Medium":        { ATK: 5 },
        "Large":         { DEF: 5 },
        "Extra large":   { DEF: 5 },
        "Titan":         { ATK: 10 },
        "Small species": { AGI: 10 },
        "Large species": { ATK: 10 },
        "Paleo species": { ATK: 10 },
    },

    builds: {
        "Emaciated": { DEF: -5 },
        "Light":     { AGI: 5 },
        "Balanced":  { ATK: 5 },
        "Heavy":     { DEF: 5 },
        "Obese":     { AGI: -5 },
    },

    ages: {
        "Under6mo": { TOTAL: -30 },
        "Under1y":  { TOTAL: -15 },
        "1y+":      {},
    },

    debuffs: {
        "MinorInjury":    { TOTAL: 0 },
        "ModerateInjury": { TOTAL: -15 },
        "MajorInjury":    { TOTAL: -30 },
    },

    disabilities: {
        "Minor":    { TOTAL: 0 },
        "Moderate": { TOTAL: -15 },
        "Major":    { TOTAL: -30 },
    },

//all skills share the same level progression, overrides for exceptions
    skill_levels: { Beginner: 0, Novice: 5, Intermediate: 10, Advanced: 15, Expert: 20, Master: 25 },

    skills: {
        Fighting:   { stat: "TOTAL", overrides: { Novice: 0 } },
        Hunting:    { stat: "ATK" },
        Healing:    { stat: "DEF" },
        Navigation: { stat: "AGI" },
        Intellect:  { stat: "PER" },
    },

//helps transform whatever the form has into proper output display (e.g. "Fighting" > "Fighter") including typos (hopefully)
    skill_display: {
        "Fighting":   "Fighter",
        "Hunting":    "Hunter",
        "Healing":    "Healer",
        "Navigation": "Navigator",
        "Intellect":  "Intellectual",
    },

//mutation modifiers
    mutation_types: {
        "offensive":  { stat: "ATK" },
        "defensive":  { stat: "DEF" },
        "perception": { stat: "PER" },
        "agility":    { stat: "AGI" },
    },

    mutations: {
        first: 10,
        extra_same: 5,
    },

// ---- SPECIALTIES ----

// requires: which skill tree (must be Master rank to use)
// forms: which tabs it appears in (fight, flee, race). "passive" = no dropdown, just exists to check for typos and recognize as a specialty
// reminder: alert shown when selected. cmd: appended to bot roll command

// Stat:      { ATK: 40, DEF: -10, requires: "Fighting", forms: ["fight"] }
// Reminder:  { requires: "Fighting", forms: ["fight"], reminder: "Shown in alerts." }
// Condition: { requires: "Fighting", forms: ["fight"], effect: { stat: "ATK", value: 20,
//                condition: { field, must_be }, conflict: "Shown when condition fails." } }
// Cmd:       { requires: "Intellect", forms: ["fight", "race"], cmd: "keyword" }
// Passive:   "passive"

// condition fields: off_acc, def_acc, companions, mutations, debuff, disability
// must_be: "empty" (not present), "filled" (present), "under_cap" (below max)
// reduce: "disability" or "debuff"

    specialties: {
        // Fighting
        "Berserker":      { ATK: 40, DEF: -10, requires: "Fighting", forms: ["fight"] },
        "Bodyguard":      { requires: "Fighting", forms: ["fight"],
            reminder: "All fights except pack challenges directed at their chosen character may be answered instead by the bodyguard, with any negative results of the battle going to the bodyguard instead of the first character." },
        "Brawler":        { TOTAL: 30, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies in melee (multiple opponent) fights." },
        "Bulwark":        { DEF: 20, requires: "Fighting", forms: ["fight"] },
        "Defender":       { DEF: 50, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies when defending pack against Siege or Raid." },
        "Juggernaut":     { ATK: 20, requires: "Fighting", forms: ["fight"] },
        "Knight":         { ATK: 40, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies in raids, sieges, responding to a freedom challenge against a packmate, or defending against intruders." },
        "Marauder":       { TOTAL: 30, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies in Raids (attacking side)." },
        "Relentless":     { requires: "Fighting", forms: ["fight"],
            reminder: "Allows 1 additional knockout in Siege or Raid." },
        "Saboteur":       { TOTAL: 30, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies when trespassing." },
        "Slave Master":   { TOTAL: 30, requires: "Fighting", forms: ["fight"],
            reminder: "Only applies in ownership challenges they initiate." },
        "Unarmed":        { ATK: 17.5, DEF: 17.5, AGI: 17.5, PER: 17.5, requires: "Fighting", forms: ["fight"],
            reminder: "Voided if character has armor or companions." },
        "Weaponsmaster":  { requires: "Fighting", forms: ["fight"],
            reminder: "Applies +20% ATK if an offensive accessory is equipped.",
            effect: { stat: "ATK", value: 20, condition: { field: "off_acc", must_be: "filled" },
            conflict: "No offensive accessory equipped, +20% ATK won't apply." } },
        // Hunting
        "Beast Master":   { ATK: 10, requires: "Hunting", forms: ["fight"],
            reminder: "Unlocks a 3rd companion slot and adds +10% attack bonus." },
        "Bloodletter":    { TOTAL: 15, requires: "Hunting", forms: ["fight"] },
        "Cooperative":    { TOTAL: 30, requires: "Hunting", forms: ["fight"],
            reminder: "Only applies when fighting alongside a friendly character (melee, raid, sieges)." },
        "Hawk-Eyed":      { PER: 30, requires: "Hunting", forms: ["fight"],
            reminder: "Must have a flying companion." },
        "Mangler":        { ATK: 40, requires: "Hunting", forms: ["fight"],
            reminder: "Only applies in maim fights." },
        "Shepherd":       { TOTAL: 40, requires: "Hunting", forms: ["fight"],
            reminder: "Only applies when defending livestock from raiders." },
        "Ranger":         "passive",
        "Trophy Hunter":  "passive",
        // Healing
        "Anatomist":      { ATK: 40, requires: "Healing", forms: ["fight"],
            reminder: "Only applies in maim fights." },
        "Field Medic":    { requires: "Healing", forms: ["fight"],
            reminder: "Allows one KO'd packmate to fight one more round in Siege/Raid." },
        "Fitness Coach":  { requires: "Healing", forms: ["fight"],
            reminder: "Allows 1 additional KO for an assisted fighter in Siege/Raid." },
        "Pacifist":       { TOTAL: 20, requires: "Healing", forms: ["fight"],
            reminder: "Only applies in fights initiated against them." },
        "Poison Master":  { ATK: 35, requires: "Healing", forms: ["fight"],
            reminder: "Only in fights they initiate. Requires offensive accessory." },
        "Cosmetologist":  "passive",
        "Fertile":        "passive",
        "Trauma Surgeon": "passive",
        // Navigation
        "Aggressor":      { TOTAL: 20, requires: "Navigation", forms: ["fight"],
            reminder: "Only applies in fights they initiate." },
        "Escape Artist":  { requires: "Navigation", forms: ["flee"],
            reminder: "Allows one extra flee attempt." },
        "Fleet-footed":   { AGI: 30, requires: "Navigation", forms: ["fight"] },
        "Houdini":        { TOTAL: 30, requires: "Navigation", forms: ["fight"],
            reminder: "Only applies in freedom challenges." },
        "Speedy":         { TOTAL: 15, requires: "Navigation", forms: ["flee", "race"] },
        "Daredevil":      "passive",
        "Infiltrator":    "passive",
        "Scout":          "passive",
        // Intellect
        "Bard":           { AURA_TOTAL: 10, requires: "Intellect", forms: ["fight"] },
        "Blessed":        { ATK: 5, DEF: 5, AGI: 5, PER: 5, requires: "Intellect", forms: ["fight"] },
        "Chaotic":        { requires: "Intellect", forms: ["fight"],
            cmd: "chaotic" },
        "Gambler":        { requires: "Intellect", forms: ["fight"],
            cmd: "gambler" },
        "Tactician":      { PER: 30, requires: "Intellect", forms: ["fight"] },
        "Traitor":        { ATK: 50, requires: "Intellect", forms: ["fight"],
            reminder: "Only applies against blood relatives." },
        "Caretaker":      "passive",
        "Dreamwalker":    "passive",
        "Naturally Talented": "passive",
        "Merchant":       "passive",
        "Professor":      "passive",
        "Seer":           "passive",
        "Witch":          "passive",
    },

//raid buff modifiers
    buffs: [
        { label: "Bard",           value: 10 },
        { label: "Trespass Boost",  value: 5 },
    ],


// ---- RACE / FLEE ----

    //race/flee variables: SPD, BAL, STA, TOTAL

    race_sizes: {
        "Toy":           { SPD: 10 },
        "Extra small":   { SPD: 10 },
        "Small":         { SPD: 5 },
        "Medium":        { BAL: 5 },
        "Large":         { STA: 5 },
        "Extra large":   { STA: 10 },
        "Titan":         { STA: 10 },
        "Small species": { SPD: 10 },
        "Large species": { STA: 10 },
        "Paleo species": { STA: 10 },
    },

    race_builds: {
        "Emaciated": { STA: -5 },
        "Light":     { SPD: 5 },
        "Balanced":  { BAL: 5 },
        "Heavy":     { STA: 5 },
        "Obese":     { SPD: -5 },
    },

    //shared accessories for flee and race tabs
    race_accessories: [
        { label: "Racing Shoes", stat: "SPD", value: 10 },
    ],


// ---- ITEMS ----

// type: "stat" (bonus), "special" (reminder only), "append" (bot command keyword)
// stat: ATK, DEF, AGI, PER, TOTAL (fight) | SPD, STA, BAL, TOTAL (race/flee)

// Flat:      { label: "Name", type: "stat", stat: "ATK", value: 10 }
// Condition: { label: "Name", type: "stat", effect: { stat: "ATK", value: 10,
//                condition: { field, must_be }, conflict: "Shown when condition fails." } }
// Reduce:    { label: "Name", type: "stat", effect: { reduce: "disability",
//                levels: { "Major": "Moderate", "Moderate": "Minor", "Minor": "" } } }
// Reminder:  { label: "Name", type: "special", reminder: "Shown in alerts." }
// Append:    { label: "Name", type: "append", cmd: "keyword" }

// condition/effect/reduce: see SPECIALTIES section

    //appear in fight form tab
    items: [
        { label: "Lucky Rabbit's Foot",         type: "append",  cmd: "luckyrabbit" },
        { label: "Black Cat's Foot",            type: "append",  cmd: "blackcat" },
        { label: "+5% Bonus Fight Score Pass",  type: "stat",    stat: "TOTAL", value: 5 },
        { label: "+10% Bonus Fight Score Pass", type: "stat",    stat: "TOTAL", value: 10 },
        { label: "Pungent Potion",              type: "stat",    stat: "ATK",   value: 10 },
        { label: "Tiger Mask",                  type: "stat",
            effect: { stat: "ATK", value: 10, condition: { field: "off_acc", must_be: "empty" }, conflict: "Already has offensive accessory." } },
        { label: "Amethyst Mask",               type: "stat",
            effect: { stat: "DEF", value: 10, condition: { field: "def_acc", must_be: "empty" }, conflict: "Already has defensive accessory." } },
        { label: "Snake Oil",                   type: "stat",
            effect: { reduce: "disability", levels: { "Major": "Moderate", "Moderate": "Minor", "Minor": "" } } },
        { label: "Equalizer",                   type: "special",
            reminder: "Equalizer found! Don't forget to yoink the other opponent's fight form!" },
        { label: "Mushroom Based Acid",         type: "special",
            reminder: "Acid Mushroom detected! Don't forget to remove an item on the opponent's form!" },
    ],

    //appear in race form tab
    race_items: [
        { label: "Go Fast Juice",      type: "stat",   stat: "SPD", value: 15 },
        { label: "Serious Steroids",   type: "stat",   stat: "STA", value: 15 },
        { label: "Goldfish in a Bag",  type: "stat",   stat: "BAL", value: 15 },
        { label: "Lucky Rabbit's Foot", type: "append", cmd: "luckyrabbit" },
        { label: "Black Cat's Foot",    type: "append", cmd: "blackcat" },
    ],

    //appear in flee form tab
    flee_items: [
        { label: "+50% Bonus Flee Score Pass", type: "stat",   stat: "TOTAL", value: 50 },
        { label: "Lucky Rabbit's Foot",        type: "append", cmd: "luckyrabbit" },
        { label: "Black Cat's Foot",           type: "append", cmd: "blackcat" },
    ],

// --- QUICK ROLLS ---

    //currently this is just for appending ids after the base command
    quick_rolls: [
        {
            name: "Trespass",
            sections: [
                { title: "Specialties", options: [
                    { label: "Infiltrator", cmd: "infiltrator" },
                ]},
                { title: "Items", options: [
                    { label: "Lucky Rabbit's Foot", cmd: "luckyrabbit" },
                    { label: "Black Cat's Foot", cmd: "blackcat" },
                ]},
            ],
            command: "!roll trespass"
        },
        //add new ones here
    ],


// ---- ALIASES (optional) ----

// shorthand phrases for auto-detection from pasted text and type handling. exact labels/names always work without aliases, but it helps with typo handling

// the only issue would be if the short term aliases are 'too short'. for example, if the short handle for lucky rabbit was just 'lucky', this would be flagged as two items: mushroom acid on firulais' lucky dagger

    item_aliases: {
        "mushroom acid":  "Mushroom Based Acid",
        "acid mushroom":  "Mushroom Based Acid",
        "lucky rabbit":   "Lucky Rabbit's Foot",
        "rabbit foot":    "Lucky Rabbit's Foot",
        "black cat":      "Black Cat's Foot",
        "pungent potion": "Pungent Potion",
        "pungent":        "Pungent Potion",
        "tiger mask":     "Tiger Mask",
        "amethyst mask":  "Amethyst Mask",
        "5%":             "+5% Bonus Fight Score Pass",
        "5 %":            "+5% Bonus Fight Score Pass",
        "5% bonus":       "+5% Bonus Fight Score Pass",
        "10%":            "+10% Bonus Fight Score Pass",
        "10 %":           "+10% Bonus Fight Score Pass",
        "10% bonus":      "+10% Bonus Fight Score Pass",
        "50%":            "+50% Bonus Flee Score Pass",
        "50 %":           "+50% Bonus Flee Score Pass",
        "flee bonus":     "+50% Bonus Flee Score Pass",
        "bard buff":      "Bard",
        "bard":           "Bard",
        "trespass buff":  "Trespass Boost",
        "trespass":       "Trespass Boost",
        "go fast":        "Go Fast Juice",
        "fast juice":     "Go Fast Juice",
        "steroids":       "Serious Steroids",
        "goldfish":       "Goldfish in a Bag",
    },

    size_aliases: {
        "xl":           "Extra large",
        "xs":           "Extra small",
        "x-large":      "Extra large",
        "x-small":      "Extra small",
        "extralarge":   "Extra large",
        "extrasmall":   "Extra small",
        "smallspecies":  "Small species",
        "largespecies":  "Large species",
        "paleospecies":  "Paleo species",
        "toysize":       "Toy",
        "toy size":      "Toy",
    },

    skill_aliases: {
        "fighter":      "Fighting",
        "hunter":       "Hunting",
        "healer":       "Healing",
        "navigator":    "Navigation",
        "intellectual": "Intellect",
    },
};
