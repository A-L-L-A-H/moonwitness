export class ModelConfigurationError extends Error {
  readonly code = 'AI_MODEL_NOT_CONFIGURED';
  constructor(message = 'No permitted AI model is configured') { super(message); this.name = 'ModelConfigurationError'; }
}
export class ModelResolutionError extends Error {
  readonly code = 'AI_MODEL_NOT_FOUND';
  constructor(model: string) { super(`Model "${model}" is not registered`); this.name = 'ModelResolutionError'; }
}
