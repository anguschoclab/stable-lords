const fs = require('fs');
const dataPath = './src/data/narrativeContent.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 1. Re-add new Openers, Whiffs, Reactions, dodges, parries
const moreOpeners = [
    "The scent of terror and sweat fills the air as {{attacker}} and {{defender}} square off.",
    "Sunlight glints off naked steel as the two gladiators step onto the killing floor.",
    "The crowd's anticipation reaches fever pitch as the gates drop.",
    "The midday sun bakes the arena as {{attacker}} and {{defender}} stalk each other.",
    "Coins change hands in the stands as {{attacker}} levels a {{weapon}} at {{defender}}.",
    "{{attacker}} raises their {{weapon}} to the crowd, soaking in the cheers before the carnage begins."
];
data.pbp.openers.push(...moreOpeners);

const newWhiffs = [
  "{{attacker}} swings wildly, their {{weapon}} cutting through empty air.",
  "A desperate lunge by {{attacker}} completely misses {{defender}}.",
  "{{defender}} effortlessly ducks under {{attacker}}'s brutal strike.",
  "{{attacker}} overcommits to the swing, stumbling forward as {{defender}} sidesteps.",
  "A phantom strike! {{attacker}}'s {{weapon}} finds nothing but the wind.",
  "{{defender}} dances back, leaving {{attacker}} swinging at shadows.",
  "The crowd groans as {{attacker}} horribly misjudges the distance."
];
data.pbp.whiffs.push(...newWhiffs);

const newDodges = [
    "{{defender}} pirouettes out of harm's way as the {{weapon}} whistles past.",
    "A masterful backstep by {{defender}} leaves {{attacker}} swinging at air.",
    "{{defender}} contorts their body, narrowly evading a lethal thrust from {{attacker}}.",
    "With feline grace, {{defender}} slips past the arc of the {{weapon}}.",
    "{{defender}} seemingly vanishes, reappearing a safe distance from {{attacker}}'s strike."
];
if(data.pbp.defenses && data.pbp.defenses.dodge && data.pbp.defenses.dodge.success) {
    data.pbp.defenses.dodge.success.push(...newDodges);
}

const newParries = [
    "Sparks fly as {{defender}} intercepts {{attacker}}'s brutal swing.",
    "{{defender}} brings their guard up just in time to deflect the {{weapon}}.",
    "A resounding CLANG echoes as {{defender}} parries the heavy blow.",
    "{{defender}} angles their defense perfectly, letting the {{weapon}} slide off harmlessly.",
    "{{attacker}}'s strike is met with an iron-clad block from {{defender}}."
];
if(data.pbp.defenses && data.pbp.defenses.parry && data.pbp.defenses.parry.success) {
    data.pbp.defenses.parry.success.push(...newParries);
}


// 2. Expand Gazette fights
const newGazetteKills = [
  "{{winner}} delivered a gruesome end to {{loser}}, painting the sands red.",
  "In a shocking display of brutality, {{winner}} executed {{loser}} before a roaring crowd.",
  "{{loser}} met a tragic end at the hands of {{winner}}'s unyielding {{styleW}} assault.",
  "The arena witnessed an absolute slaughter as {{winner}} destroyed {{loser}}.",
  "{{winner}}'s {{styleW}} proved fatal for the unfortunate {{loser}}."
];
if(data.gazette && data.gazette.fights && data.gazette.fights.Kill) {
    data.gazette.fights.Kill.push(...newGazetteKills);
}

const newGazetteKOs = [
  "{{winner}} put {{loser}} to sleep with a devastating blow.",
  "A brutal concussion left {{loser}} unconscious at the feet of {{winner}}.",
  "{{winner}}'s sheer power overwhelmed {{loser}}, ending in a swift knockout.",
  "The lights went out for {{loser}} after a masterful strike by {{winner}}.",
  "{{loser}} was battered into unconsciousness by a relentless {{winner}}."
];
if(data.gazette && data.gazette.fights && data.gazette.fights.KO) {
    data.gazette.fights.KO.push(...newGazetteKOs);
}

// Ensure the tests have the required item (without deleting old ones)
if (!data.commentary) data.commentary = {};
if (!data.commentary.KO) data.commentary.KO = [];
if (!data.commentary.KO.includes("What a knockout! The crowd erupts!")) {
    data.commentary.KO.push("What a knockout! The crowd erupts!");
}

// 3. New engine hooks: We'll add a new key "executions" inside pbp that narrator will use
if(!data.pbp.executions) data.pbp.executions = [];
data.pbp.executions.push(
  "{{attacker}} feints low, catching {{defender}} off guard before severing their sword-arm at the elbow. The crowd erupts!",
  "With a terrifying roar, {{attacker}} drives their {{weapon}} straight through {{defender}}'s sternum, ending it instantly.",
  "{{defender}} stumbles, and {{attacker}} capitalizes with a brutal decapitating swing. Blood sprays across the sand!",
  "A sickening crunch echoes as {{attacker}}'s {{weapon}} caves in {{defender}}'s skull. It is over.",
  "{{attacker}} sweeps {{defender}}'s legs out and delivers a final, merciless downward thrust."
);

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
