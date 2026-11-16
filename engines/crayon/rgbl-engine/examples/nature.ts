import {createCrayonEngine} from "../engine/src/index.js";

const result = createCrayonEngine().analyze({
  domain: "nature",
  question: "Why is this plant growing differently in two locations?",
  observations: ["Plant A receives more sunlight", "Plant B has wetter soil"],
  evidence: ["Height recorded weekly for four weeks", "Soil moisture measured daily"],
  patterns: ["Growth rate differs consistently between locations"],
  relations: ["Sunlight and soil moisture covary with growth conditions"],
  actors: ["plants", "surrounding ecosystem", "observer"],
  impacts: ["care decisions can improve or harm growth"],
  possibilities: ["run a controlled comparison", "measure more variables"],
  nextActions: ["control water while comparing sunlight exposure"],
  cautions: ["Correlation alone does not establish causation"],
  benefits: ["better evidence for plant care"],
});

console.dir(result, {depth: null});
