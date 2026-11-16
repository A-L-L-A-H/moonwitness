import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { errorResponse, successResponse } from '@rocksoul/common';
import { authorize } from '../../security/authorization.js';

const reviewTransitions: Record<string, readonly string[]> = { pending:['assigned','in_review','cancelled'], assigned:['in_review','cancelled'], in_review:['needs_sources','needs_changes','approved','rejected','cancelled'], needs_sources:['in_review','cancelled'], needs_changes:['in_review','cancelled'], approved:['published','superseded'], rejected:['superseded'], published:['superseded'], superseded:[], cancelled:[] };
const caseTransitions: Record<string, readonly string[]> = { draft:['open','archived'], open:['in_review','blocked','resolved','archived'], in_review:['open','blocked','resolved','archived'], blocked:['open','archived'], resolved:['archived'], archived:[] };

function allowed(app: FastifyInstance, request: any, reply: any, resource: string, action: 'read'|'create'|'update') {
  if (authorize(request.principal, resource, action).allowed) return true;
  reply.code(403).send(errorResponse({ code: 'FORBIDDEN', statusCode: 403 }, 'You are not authorized to perform this workflow action')); return false;
}
export async function operationalWorkflowRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', app.authenticate);
  app.post<{Params:{id:string};Body:{status:string;reason?:string}}>('/cases/:id/transition', async (request, reply) => {
    if (!allowed(app, request, reply, 'research_cases', 'update')) return;
    const row = await app.dbClient.execute({sql:'SELECT status FROM research_cases WHERE id = ?',args:[request.params.id]}); const from=String(row.rows[0]?.status ?? ''); const to=request.body?.status;
    if (!to || !caseTransitions[from]?.includes(to)) return reply.code(400).send(errorResponse({code:'INVALID_CASE_TRANSITION',statusCode:400},'Invalid case status transition'));
    const now=new Date().toISOString(); await app.dbClient.execute({sql:'UPDATE research_cases SET status=?, updated_by=?, updated_at=?, opened_at=CASE WHEN ?=\'open\' AND opened_at IS NULL THEN ? ELSE opened_at END, closed_at=CASE WHEN ? IN (\'resolved\',\'archived\') THEN ? ELSE closed_at END WHERE id=?',args:[to,request.principal!.userId,now,to,now,to,now,request.params.id]}); await app.dbClient.execute({sql:'INSERT INTO case_status_history (id,case_id,from_status,to_status,changed_by,reason,created_at) VALUES (?,?,?,?,?,?,?)',args:[randomUUID(),request.params.id,from,to,request.principal!.userId,request.body.reason ?? null,now]}); return reply.send(successResponse({id:request.params.id,fromStatus:from,toStatus:to},'Case transitioned'));
  });
  app.post<{Params:{id:string};Body:{assigneeId:string}}>('/reviews/:id/assign', async (request, reply) => {
    if (!allowed(app,request,reply,'review_items','update')) return; if (!request.body?.assigneeId) return reply.badRequest('assigneeId is required'); const now=new Date().toISOString(); const existing=await app.dbClient.execute({sql:'SELECT status FROM review_items WHERE id=?',args:[request.params.id]}); const status=String(existing.rows[0]?.status ?? ''); if (!['pending','assigned'].includes(status)) return reply.code(400).send(errorResponse({code:'INVALID_REVIEW_TRANSITION',statusCode:400},'Only pending reviews can be assigned'));
    await app.dbClient.execute({sql:'UPDATE review_items SET assigned_to=?, status=\'assigned\', updated_at=? WHERE id=?',args:[request.body.assigneeId,now,request.params.id]}); await app.dbClient.execute({sql:'INSERT INTO review_assignments (id,review_item_id,assignee_id,assigned_by,status,assigned_at) VALUES (?,?,?,?,?,?)',args:[randomUUID(),request.params.id,request.body.assigneeId,request.principal!.userId,'assigned',now]}); return reply.send(successResponse({id:request.params.id,status:'assigned'},'Review assigned'));
  });
  app.post<{Params:{id:string}}>('/reviews/:id/start', async (request, reply) => {
    if (!allowed(app, request, reply, 'review_items', 'update')) return;
    const result = await app.dbClient.execute({ sql: "UPDATE review_items SET status = 'in_review', updated_at = ? WHERE id = ? AND status = 'assigned'", args: [new Date().toISOString(), request.params.id] });
    if (result.rowsAffected === 0) return reply.code(400).send(errorResponse({ code: 'INVALID_REVIEW_TRANSITION', statusCode: 400 }, 'Only assigned reviews can start review'));
    return reply.send(successResponse({ id: request.params.id, status: 'in_review' }, 'Review started'));
  });
  app.post<{Params:{id:string};Body:{decision:'approve'|'reject'|'request_changes'|'request_sources'|'defer';reason?:string;notes?:string}}>('/reviews/:id/decisions', async (request, reply) => {
    if (!allowed(app,request,reply,'review_items','update')) return; const d=request.body?.decision; if (!d) return reply.badRequest('decision is required'); const target={approve:'approved',reject:'rejected',request_changes:'needs_changes',request_sources:'needs_sources',defer:'assigned'}[d]; const row=await app.dbClient.execute({sql:'SELECT status FROM review_items WHERE id=?',args:[request.params.id]}); const from=String(row.rows[0]?.status ?? ''); if (!reviewTransitions[from]?.includes(target)) return reply.code(400).send(errorResponse({code:'INVALID_REVIEW_TRANSITION',statusCode:400},'Invalid review decision for current status'));
    const now=new Date().toISOString(); await app.dbClient.execute({sql:'UPDATE review_items SET status=?, reviewed_at=?, updated_at=? WHERE id=?',args:[target,now,now,request.params.id]}); await app.dbClient.execute({sql:'INSERT INTO review_decisions (id,review_item_id,decision,reason,notes,decided_by,decided_at) VALUES (?,?,?,?,?,?,?)',args:[randomUUID(),request.params.id,d,request.body.reason ?? null,request.body.notes ?? null,request.principal!.userId,now]}); return reply.send(successResponse({id:request.params.id,status:target},'Review decision recorded'));
  });
  app.post<{Params:{id:string};Body:{targetRepository:string;targetDomain:string;sourceRef?:string;payloadJson?:string}}>('/reviews/:id/publications', async (request, reply) => {
    if (!allowed(app,request,reply,'review_items','update')) return; const review=await app.dbClient.execute({sql:'SELECT status FROM review_items WHERE id=?',args:[request.params.id]}); if (review.rows[0]?.status !== 'approved') return reply.code(409).send(errorResponse({code:'REVIEW_NOT_APPROVED',statusCode:409},'Publication requires an approved review')); if (!request.body?.targetRepository || !request.body?.targetDomain) return reply.badRequest('targetRepository and targetDomain are required'); const id=randomUUID(), now=new Date().toISOString(); await app.dbClient.execute({sql:'INSERT INTO publication_requests (id,review_item_id,target_repository,target_domain,source_ref,payload_json,status,requested_by,requested_at,created_at,updated_at) VALUES (?,?,?,?,?,?,\'pending\',?,?,?,?)',args:[id,request.params.id,request.body.targetRepository,request.body.targetDomain,request.body.sourceRef ?? null,request.body.payloadJson ?? null,request.principal!.userId,now,now,now]}); return reply.code(201).send(successResponse({id,status:'pending'},'Publication request created; canonical publication remains remote-owner responsibility'));
  });
}
