import { performance } from 'node:perf_hooks';
import { createAppClient } from '../dist/index.js';

const iterations = Number(process.env.AEP_BENCH_ITERATIONS ?? 1_000);
const models = {
  list: async () => ({ items: [{ id: 'project-1' }], total: 1, page: 1, limit: 20, totalPages: 1 }),
  read: async (_model, id) => ({ id }),
  create: async (_model, input) => ({ id: 'new', ...input }),
  update: async (_model, id, input) => ({ id, ...input }),
  remove: async (_model, id) => ({ id, deleted: true }),
  metadata: async () => ({}),
  menu: async () => [],
};
const app = createAppClient({ models });

const measure = async (name, operation) => {
  const samples = [];
  const start = performance.now();
  for (let index = 0; index < iterations; index += 1) {
    const sampleStart = performance.now();
    await operation(index);
    samples.push(performance.now() - sampleStart);
  }
  samples.sort((a, b) => a - b);
  const percentile = rank => samples[Math.min(samples.length - 1, Math.floor(samples.length * rank))];
  return {
    name,
    iterations,
    elapsedMs: performance.now() - start,
    p50Ms: percentile(0.50),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
  };
};

const results = [
  await measure('direct-model-read', index => models.read('projects', `project-${index}`)),
  await measure('application-resource-read', index => app.projects.get(`project-${index}`)),
  await measure('application-batch-two-reads', index => app.batch({ project: app.projects.get(`project-${index}`), task: app.tasks.get(`task-${index}`) })),
];
console.log(JSON.stringify({ benchmark: 'aep-sdk-dx', iterations, results }, null, 2));
