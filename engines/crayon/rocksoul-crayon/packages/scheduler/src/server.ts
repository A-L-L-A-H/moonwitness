import fastify from 'fastify';
import cors from '@fastify/cors';
import { schedulerPlugin } from './fastify-plugin.js';
import { config } from './config.js';
export async function buildSchedulerServer(options: { databaseUrl?: string } = {}){const app=fastify({logger:{level:process.env.LOG_LEVEL||'info'},bodyLimit:1024*1024});await app.register(cors,{origin:process.env.SCHEDULER_CORS_ORIGIN||false});await app.register(schedulerPlugin, options);return app;}
if(process.argv[1]?.endsWith('server.js')||process.argv[1]?.endsWith('server.ts')){const app=await buildSchedulerServer();app.listen({host:config.host,port:config.port}).then(()=>app.log.info(`Scheduler listening on ${config.host}:${config.port}`)).catch(e=>{app.log.error(e);process.exit(1)})}
