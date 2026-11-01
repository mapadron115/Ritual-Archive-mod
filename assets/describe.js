// A port of the mod's Common/Describe.cs: turns the archive's tabletop text into what plays in Terraria
// (average damage, life, tiles, seconds) for a chosen level and max life. Keep it in step with the C# file.
(function () {
  "use strict";

  const SCALE = [2.0, 2.2, 2.8, 3.2, 3.6, 5.0, 5.6, 6.2, 6.8, 7.5, 10, 11, 12, 13, 14, 15, 16, 22, 24, 30];
  const damageScale = (level) => SCALE[Math.min(20, Math.max(1, level)) - 1];
  const profBonus = (level) => 2 + Math.floor((level - 1) / 4);
  const ceMod = (level) => (level >= 11 ? 5 : level >= 6 ? 4 : 3);
  const frameworkDie = (level) => (level >= 17 ? 12 : level >= 11 ? 10 : level >= 5 ? 8 : 6);

  const Chance = /\{chance (?<b>PB\+CE|PB) (?<n>\d+)\}/g;
  const Saves = /\s*\((?:Str|Dex|Con|Wis|Int|Cha|will save|Str save|Con save|Dex save)\)/g;
  const StrMod = /\s*\+\s*Str mod\b/g;
  const LevelTimes = /(?<n>\d+)\s*×\s*level\b/g;
  const LevelCE = /\blevel\s*×\s*CE mod\b/g;
  const LevelPB = /\blevel\s*\+\s*PB\b/g;
  const TimesPBGroup = /(?<n>\d+)\s*×\s*\(PB\s*\+\s*(?<m>\d+)\)/g;
  const TimesPB = /(?<n>\d+)\s*×\s*PB\b/g;
  const PB = /\bPB(?=\b|d\d)/g;
  const CEMod = /\bCE mod(?:ifier)?\b/g;
  const Product = /(?<![\w.])(?<a>\d+)\s*×\s*(?<b>\d+)(?![\w])/g;
  const Sum = /(?<![\w.])(?<a>\d+)\s*\+\s*(?<b>\d+)(?![\w])/g;
  const FlatDamage = /\[(?<n>\d+) dmg\]/g;
  const FlatLife = /\[(?<n>\d+) life\]/g;
  const ParenDice = /\((?<n>\d+)\)\s?d(?<d>\d+)/g;
  const ParenExprDice = /\((?<e>[^()]+)\)\s?d(?<d>\d+)/g;
  const Dice = /(?<![A-Za-z])(?<n>\d+)?\s?d(?<d>\d+)(?:\s*\+\s*(?<flat>\d+))?(?![\w])/g;
  const NamedDice = /(?<![\w])(?:(?<n>\d+|an?|one)\s+)?(?:[A-Z][\w-]*\s+){1,2}(?:Dice|Die)\b(?:\s*\+\s*(?<flat>\d+))?/g;
  const PlainDice = /(?<n>\d+)\s+(?:more\s+)?dice\b/g;
  const Feet = /(?<n>\d+)(?<sep>-|\s)?(?:ft|feet|foot)\b/g;
  const RoundPhrases = /\b(?:once per round|per round|each round|every round|until the next round|to the start of the round|a round ago|for a round|this round|(?<n>\d+) rounds?|a round|one round)\b/gi;
  const DomainRound = /\b(?:each|every) round\b|\buntil the next round\b|\ba round ago\b/g;

  // String.replace hands the callback (match, ...groups, offset, input, namedGroups).
  function rep(text, re, fn) {
    return text.replace(re, (...args) => {
      const named = typeof args[args.length - 1] === "object" ? args[args.length - 1] : {};
      const input = args[args.length - 2];
      const offset = args[args.length - 3];
      return fn(args[0], named || {}, offset, input);
    });
  }

  function text(src, tech, ctx) {
    if (!src) return src;
    const level = ctx.level, pb = profBonus(level), ce = ceMod(level);
    const scale = damageScale(level);
    const life = ctx.life / 100;
    // A die counts 80% of the way up its range in play, not its tabletop average (Common.Dice in the mod).
    const die = (sides) => (sides <= 1 ? sides : 1 + (sides - 1) * 0.8);
    const namedMean = die((tech && tech.namedDie) || frameworkDie(level));
    let t = src;

    t = rep(t, Chance, (m, g) => {
      const bonus = g.b === "PB" ? pb : pb + ce;
      return Math.min(100, Math.max(5, (21 - (parseInt(g.n, 10) - bonus)) * 5)) + "%";
    });
    t = t.replace(Saves, "");
    t = t.replace(StrMod, "");
    t = rep(t, LevelTimes, (m, g) => String(parseInt(g.n, 10) * level));
    t = t.replace(LevelCE, String(level * ce));
    t = t.replace(LevelPB, String(level + pb));
    t = rep(t, TimesPBGroup, (m, g) => String(parseInt(g.n, 10) * (pb + parseInt(g.m, 10))));
    t = rep(t, TimesPB, (m, g) => String(parseInt(g.n, 10) * pb));
    t = t.replace(PB, String(pb));
    t = t.replace(CEMod, String(ce));
    for (let pass = 0; pass < 2; pass++) {
      t = rep(t, Product, (m, g) => String(parseInt(g.a, 10) * parseInt(g.b, 10)));
      t = rep(t, Sum, (m, g) => String(parseInt(g.a, 10) + parseInt(g.b, 10)));
    }
    t = rep(t, FlatDamage, (m, g) => Math.max(1, Math.trunc(parseInt(g.n, 10) * scale)) + " damage");
    t = rep(t, FlatLife, (m, g) => String(Math.max(1, Math.trunc(parseInt(g.n, 10) * life))));

    // What a die is worth depends on what it does: hits scale with level, heals and blocks with max life.
    function worth(archive, index, source) {
      const start = Math.max(0, index - 32);
      const before = source.substring(start, index).toLowerCase();
      const after = source.substring(index, index + 24).toLowerCase();
      if (before.includes("heal") || before.includes("repair") || before.includes("mend") || after.includes("healing"))
        return Math.max(1, Math.trunc(archive * life)) + " life";
      if (before.includes("reduced by") || before.includes("block") || before.includes("blunt"))
        return String(Math.max(1, Math.trunc(archive * life)));
      return Math.max(1, Math.trunc(archive * scale)) + " damage";
    }
    const flat = (v) => (v ? parseInt(v, 10) : 0);

    t = rep(t, ParenDice, (m, g, i, input) => worth(parseInt(g.n, 10) * die(parseInt(g.d, 10)), i, input));
    t = rep(t, ParenExprDice, (m, g, i, input) => `(${g.e}) × ${worth(die(parseInt(g.d, 10)), i, input)}`);
    t = rep(t, Dice, (m, g, i, input) => {
      const n = g.n ? parseInt(g.n, 10) : 1;
      return worth(n * die(parseInt(g.d, 10)) + flat(g.flat), i, input);
    });
    t = rep(t, NamedDice, (m, g, i, input) => {
      const n = /^\d+$/.test(g.n || "") ? parseInt(g.n, 10) : 1;
      return worth(n * namedMean + flat(g.flat), i, input);
    });
    t = rep(t, PlainDice, (m, g, i, input) => worth(parseInt(g.n, 10) * namedMean, i, input));

    t = rep(t, Feet, (m, g) => {
      const tiles = Math.round((parseInt(g.n, 10) / 2) * 10) / 10;
      return tiles + (g.sep === "-" ? "-tile" : " tiles");
    });
    t = rep(t, RoundPhrases, (m, g) => {
      let said;
      switch (m.toLowerCase()) {
        case "once per round": said = "once every 6 s"; break;
        case "per round": case "each round": case "every round": said = "every 6 s"; break;
        case "until the next round": case "for a round": said = "for 6 s"; break;
        case "to the start of the round": said = "6 s back"; break;
        case "a round ago": said = "6 s ago"; break;
        case "this round": said = "in the last 6 s"; break;
        case "a round": case "one round": said = "6 s"; break;
        default: said = parseInt(g.n, 10) * 6 + " s";
      }
      // "Every round, ..." starts a sentence
      return m[0] !== m[0].toLowerCase() ? said[0].toUpperCase() + said.slice(1) : said;
    });
    return t;
  }

  function domain(src, tech, intervalSeconds, ctx) {
    if (!src) return src;
    const s = intervalSeconds;
    const t = src.replace(DomainRound, (m) =>
      m === "until the next round" ? "until the next sure-hit" : m === "a round ago" ? `${s} s ago` : `every ${s} s`);
    return text(t, tech, ctx);
  }

  window.Describe = { text, domain, profBonus, ceMod, damageScale };
})();
