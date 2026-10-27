const pension = require('./pension');
const passport = require('./passport');
const traffic = require('./traffic');
const homeAffairs = require('./homeAffairs');
const defaultRules = require('./default');
const RULE_PACKS = { pension, passport, traffic, home_affairs: homeAffairs, finance: defaultRules, police: defaultRules };
function evaluate(department, application, citizen) {
  const pack = RULE_PACKS[department];
  if (!pack) return { eligible:true, reason:`No rule pack for "${department}"`, rule_id:'NO_RULE_PACK', warnings:[] };
  return pack.evaluate(application, citizen);
}
module.exports = { evaluate };
