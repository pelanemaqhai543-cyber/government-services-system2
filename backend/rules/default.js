function evaluate(application, citizen) {
  return { eligible:true, reason:'No specific rules — routed to officer', rule_id:'DEFAULT_OK', warnings:[] };
}
module.exports = { evaluate };
