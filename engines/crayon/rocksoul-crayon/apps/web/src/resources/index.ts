import { ResourceRegistry } from '../ui-runtime/metadata/registry.js';
import { taskResource } from './task.resource.js';
import { projectResource } from './project.resource.js';
import { userResource } from './user.resource.js';
import { mailResource, chatResource } from './mail-chat.resource.js';

export function initializeResources(): void {
  ResourceRegistry.register(taskResource);
  ResourceRegistry.register(projectResource);
  ResourceRegistry.register(userResource);
  ResourceRegistry.register(mailResource);
  ResourceRegistry.register(chatResource);
}

// Auto initialize on import
initializeResources();

export * from './task.resource.js';
export * from './project.resource.js';
export * from './user.resource.js';
export * from './mail-chat.resource.js';
