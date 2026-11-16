import {createCrayonEngine} from "../engine/src/index.js";

const result = createCrayonEngine().analyze({
  domain: "justice",
  question: "How should a dispute over a shared object be handled?",
  observations: ["Two people claim the same object", "The object was damaged during the dispute"],
  evidence: ["A witness saw who had the object first", "A shared-use rule exists"],
  patterns: ["Similar disputes happen when turn-taking is unclear"],
  actors: ["claimant A", "claimant B", "witness"],
  intentions: ["Both say they intended to use the object"],
  impacts: ["property damage", "relationship tension"],
  values: ["fairness", "rights", "repair", "proportionality"],
  interpretations: ["ownership dispute", "turn-taking dispute"],
  possibilities: ["clarify ownership", "mediate", "repair the object", "set a turn-taking rule"],
  nextActions: ["verify ownership and the shared-use rule before deciding"],
  cautions: ["Do not treat the loudest person as the most credible"],
  benefits: ["fairer decision", "reduced repeat conflict"],
});

console.dir(result, {depth: null});
