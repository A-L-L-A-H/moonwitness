import type { ToolDefinition } from '@rocksoul/ai-core';

export const systemInfoTool: ToolDefinition = {
  id: 'system_info',
  name: 'System Info',
  description: 'Returns basic system runtime information (Node.js version, platform, timestamp).',
  category: 'safe',
  policy: 'ALLOW',
  schema: {
    type: 'object',
    properties: {},
  },
  execute: async (_input, context) => {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
    };
  },
};

export const timeNowTool: ToolDefinition = {
  id: 'time_now',
  name: 'Current Time',
  description: 'Returns the current server time and timezone.',
  category: 'safe',
  policy: 'ALLOW',
  schema: {
    type: 'object',
    properties: {
      timezone: { type: 'string', description: 'Optional timezone' },
    },
  },
  execute: async (input) => {
    return {
      iso: new Date().toISOString(),
      timezone: input?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  },
};

export const calculatorTool: ToolDefinition = {
  id: 'calculator',
  name: 'Calculator',
  description: 'Performs basic mathematical operations.',
  category: 'safe',
  policy: 'ALLOW',
  schema: {
    type: 'object',
    required: ['operation', 'a', 'b'],
    properties: {
      operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
      a: { type: 'number' },
      b: { type: 'number' },
    },
  },
  execute: async (input) => {
    const { operation, a, b } = input;
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero is not permitted.');
        return { result: a / b };
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  },
};
