import type {Domain} from "../core/types.js";

export interface DomainProfile {
  name: Domain;
  world: string;
  question: string;
  boundary: string;
  preferredSources: string[];
}

export const DOMAIN_PROFILES: Record<Domain, DomainProfile> = {
  allah: {
    name: "allah",
    world: "SOURCE",
    question: "What can be responsibly recognized about Allah through reality, reasoning, and revelation?",
    boundary: "Do not treat Allah as an empirically measurable object. Distinguish observed signs, philosophical reasoning, and revelation-based theological claims.",
    preferredSources: ["observation", "reasoning", "revelation", "document"],
  },
  human: {
    name: "human",
    world: "SELF",
    question: "Who am I, what patterns shape me, and what do my choices mean?",
    boundary: "Do not reduce a person to one action, label, feeling, failure, or success.",
    preferredSources: ["observation", "testimony", "reasoning", "document"],
  },
  nature: {
    name: "nature",
    world: "WORLD",
    question: "How does observable reality work, and what patterns can be tested?",
    boundary: "Keep observation, measurement, model, and interpretation distinct; prefer testable claims where applicable.",
    preferredSources: ["observation", "measurement", "document", "reasoning"],
  },
  justice: {
    name: "justice",
    world: "OTHERS",
    question: "What is fair, who is affected, and what decision is proportionate and responsible?",
    boundary: "Do not decide from volume, status, or first impressions; examine facts, rules, rights, intention, impact, alternatives, and repair.",
    preferredSources: ["observation", "document", "testimony", "reasoning"],
  },
  general: {
    name: "general",
    world: "GENERAL",
    question: "What is happening, what pattern exists, what does it mean, and what should happen next?",
    boundary: "State unknowns and confidence; do not convert uncertainty into certainty.",
    preferredSources: ["observation", "document", "reasoning"],
  },
};
