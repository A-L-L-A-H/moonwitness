import type {
  Consequence,
  Entity,
  Intent,
  StateSnapshot,
  Transition,
  TransitionPrecondition,
  TransitionReadiness,
} from "./model.js";

export function snapshot(entities: Entity[]): StateSnapshot {
  return {
    entities: Object.fromEntries(
      entities.map((entity) => [entity.id, structuredClone(entity.state)]),
    ),
  };
}

function applyEffect(
  state: StateSnapshot,
  effect: Consequence["effects"][number],
): void {
  const entity = state.entities[effect.entity];
  if (!entity) {
    throw new Error(`Unknown entity in effect: ${effect.entity}`);
  }

  if (typeof effect.delta === "number") {
    const current = entity[effect.property];
    if (typeof current !== "number") {
      throw new Error(
        `Cannot apply numeric delta to non-number ${effect.entity}.${effect.property}`,
      );
    }
    entity[effect.property] = current + effect.delta;
    return;
  }

  if ("to" in effect) {
    entity[effect.property] = effect.to;
  }
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function derivePreconditions(args: {
  transitionId: string;
  before: StateSnapshot;
  consequence: Consequence;
  explicit?: TransitionPrecondition[];
}): TransitionPrecondition[] {
  const explicit = args.explicit ?? [];
  const explicitKeys = new Set(
    explicit.map((item) => `${item.entity}::${item.property}`),
  );

  const derived = args.consequence.effects
    .filter(
      (effect) => !explicitKeys.has(`${effect.entity}::${effect.property}`),
    )
    .map((effect, index) => ({
      id: `${args.transitionId}:precondition:${index}`,
      entity: effect.entity,
      property: effect.property,
      expected: structuredClone(
        args.before.entities[effect.entity]?.[effect.property],
      ),
      source: "derived" as const,
    }));

  return [...structuredClone(explicit), ...derived];
}

export function simulateTransition(args: {
  id: string;
  entities: Entity[];
  intent: Intent;
  consequence: Consequence;
  preconditions?: TransitionPrecondition[];
}): Transition {
  const before = snapshot(args.entities);
  const predictedState = structuredClone(before);

  for (const effect of args.consequence.effects) {
    applyEffect(predictedState, effect);
  }

  return {
    id: args.id,
    before,
    prediction: {
      id: `${args.id}:prediction`,
      state: predictedState,
      effects: structuredClone(args.consequence.effects),
    },
    preconditions: derivePreconditions({
      transitionId: args.id,
      before,
      consequence: args.consequence,
      explicit: args.preconditions,
    }),
    intent: args.intent,
    consequence: args.consequence,
  };
}

export function evaluateTransitionReadiness(args: {
  transition: Transition;
  currentEntities: Entity[];
  evaluatedAt: string;
}): TransitionReadiness {
  const current = snapshot(args.currentEntities);
  const failures = args.transition.preconditions.flatMap((precondition) => {
    const actual = current.entities[precondition.entity]?.[precondition.property];

    if (sameValue(actual, precondition.expected)) {
      return [];
    }

    return [
      {
        preconditionId: precondition.id,
        entity: precondition.entity,
        property: precondition.property,
        expected: structuredClone(precondition.expected),
        actual: structuredClone(actual),
      },
    ];
  });

  if (failures.length === 0) {
    return {
      status: "valid",
      transitionId: args.transition.id,
      evaluatedAt: args.evaluatedAt,
      failures: [],
    };
  }

  return {
    status: "stale",
    transitionId: args.transition.id,
    evaluatedAt: args.evaluatedAt,
    failures,
    requiredAction: "reobserve-and-resimulate",
  };
}
