import {createCrayonEngine} from "../engine/src/index.js";

const result = createCrayonEngine().analyze({
  domain: "allah",
  question: "What can be responsibly recognized about Allah using the CRAYON framework?",
  observations: ["The observable world contains change, dependence, life, and regularities"],
  evidence: ["Observable natural phenomena can be studied", "Human beings ask questions about source, meaning, and purpose"],
  patterns: ["Many phenomena exhibit stable regularities that can be described"],
  relations: ["Created things can be described as dependent on conditions beyond themselves"],
  actors: ["human inquirer"],
  impacts: ["The answer changes orientation, responsibility, and meaning for the inquirer"],
  values: ["truthfulness", "humility", "responsibility"],
  interpretations: ["philosophical source explanation", "theological recognition informed by revelation"],
  possibilities: ["compare explanations", "study revelation as a theological source", "state evidentiary limits"],
  nextActions: ["separate observable signs, philosophical reasoning, and revelation-based claims in the final account"],
  cautions: ["CRAYON does not empirically measure Allah", "Do not present a revelation-based attribute as an empirical measurement"],
  benefits: ["a clearer and more disciplined theological inquiry"],
  sources: [
    {id:"creation", label:"observable creation", type:"observation"},
    {id:"reasoning", label:"philosophical reasoning", type:"reasoning"},
    {id:"quran", label:"Qur'anic revelation", type:"revelation", note:"domain source for Islamic theological claims"},
  ],
  structuredClaims: [
    {id:"allah-signs",text:"Observable creation contains change, dependence, life, and regularities.",level:"R1",type:"observation",evidenceClass:"empirical",sourceRefs:["creation"]},
    {id:"allah-source-question",text:"Dependence and order raise a philosophical question about ultimate source.",level:"G2",type:"inference",evidenceClass:"philosophical",sourceRefs:["reasoning"],dependsOn:["allah-signs"]},
    {id:"allah-recognition",text:"Allah is recognized theologically as Creator.",level:"L4",type:"theological-claim",evidenceClass:"revelation",sourceRefs:["quran"],dependsOn:["allah-source-question"]},
  ],
});

console.dir(result, {depth: null});
