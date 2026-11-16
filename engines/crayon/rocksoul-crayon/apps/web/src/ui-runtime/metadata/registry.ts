import type { ResourceDefinition, FieldDefinition } from './contracts.js';
import type { ComponentType } from 'react';

export class ResourceRegistry {
  private static resources: Map<string, ResourceDefinition> = new Map();

  static register(definition: ResourceDefinition): void {
    this.resources.set(definition.id, definition);
    if (definition.model) {
      this.resources.set(definition.model, definition);
    }
  }

  static get(idOrModel: string): ResourceDefinition | undefined {
    return this.resources.get(idOrModel);
  }

  static list(): ResourceDefinition[] {
    const unique = new Set(this.resources.values());
    return Array.from(unique);
  }

  static has(idOrModel: string): boolean {
    return this.resources.has(idOrModel);
  }
}

export interface FieldRendererProps<T = unknown> {
  value: T;
  onChange?: (value: T) => void;
  definition: FieldDefinition;
  mode?: 'view' | 'edit';
  error?: string;
  className?: string;
}

export class RendererRegistry {
  private static fieldRenderers: Map<string, ComponentType<FieldRendererProps>> = new Map();
  private static viewRenderers: Map<string, ComponentType<Record<string, unknown>>> = new Map();

  static registerField(type: string, component: ComponentType<FieldRendererProps>): void {
    this.fieldRenderers.set(type, component);
  }

  static getField(type: string): ComponentType<FieldRendererProps> | undefined {
    return this.fieldRenderers.get(type);
  }

  static registerView(type: string, component: ComponentType<Record<string, unknown>>): void {
    this.viewRenderers.set(type, component);
  }

  static getView(type: string): ComponentType<Record<string, unknown>> | undefined {
    return this.viewRenderers.get(type);
  }
}
