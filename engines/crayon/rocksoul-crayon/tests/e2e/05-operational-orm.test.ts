import { setupTestEnvironment, getTestApp, TEST_FIXTURES } from './setup.js';

const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const auth = { 'x-api-key': TEST_FIXTURES.apiKey.raw };

export async function runOperationalOrmTests(): Promise<void> {
  await setupTestEnvironment(true);
  const app = await getTestApp();
  try {
    const unauthenticated = await app.inject({ method: 'POST', url: '/api/v1/operational/cases/case-e2e/transition', payload: { status: 'open' } });
    assert(unauthenticated.statusCode === 401, `Expected unauthenticated workflow request to fail with 401, got ${unauthenticated.statusCode}`);

    const resource = await app.inject({ method: 'POST', url: '/api/v1/models/resource_references', headers: auth, payload: { id: 'res-e2e', repository: 'rocksoul-superhero', domain: 'PERSON', record_type: 'person', record_id: 'PER-E2E', canonical_ref: 'superhero:PER-E2E', resolution: 'canonical', title: 'E2E person' } });
    assert(resource.statusCode === 201, `Resource create failed: ${resource.statusCode} ${resource.body}`);
    const duplicate = await app.inject({ method: 'POST', url: '/api/v1/models/resource_references', headers: auth, payload: { id: 'res-e2e-duplicate', repository: 'rocksoul-superhero', domain: 'PERSON', record_type: 'person', record_id: 'PER-E2E', canonical_ref: 'superhero:PER-E2E', resolution: 'canonical' } });
    assert(duplicate.statusCode === 400, `Duplicate canonical ref must be rejected, got ${duplicate.statusCode}`);

    const createdCase = await app.inject({ method: 'POST', url: '/api/v1/models/research_cases', headers: auth, payload: { id: 'case-e2e', case_no: 'CASE-E2E', title: 'E2E operational case', status: 'draft', priority: 'medium', owner_id: TEST_FIXTURES.admin.id } });
    assert(createdCase.statusCode === 201, `Case create failed: ${createdCase.statusCode} ${createdCase.body}`);
    const invalidCaseTransition = await app.inject({ method: 'POST', url: '/api/v1/operational/cases/case-e2e/transition', headers: auth, payload: { status: 'resolved' } });
    assert(invalidCaseTransition.statusCode === 400, `Invalid case transition must fail, got ${invalidCaseTransition.statusCode}`);
    const openCase = await app.inject({ method: 'POST', url: '/api/v1/operational/cases/case-e2e/transition', headers: auth, payload: { status: 'open' } });
    assert(openCase.statusCode === 200, `Draft→open case transition failed: ${openCase.statusCode} ${openCase.body}`);

    const review = await app.inject({ method: 'POST', url: '/api/v1/models/review_items', headers: auth, payload: { id: 'review-e2e', kind: 'resource', case_id: 'case-e2e', resource_reference_id: 'res-e2e', status: 'pending', priority: 'medium', submitted_by: TEST_FIXTURES.admin.id } });
    assert(review.statusCode === 201, `Review create failed: ${review.statusCode} ${review.body}`);
    const prematurePublication = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/publications', headers: auth, payload: { targetRepository: 'rocksoul-superhero', targetDomain: 'PERSON' } });
    assert(prematurePublication.statusCode === 409, `Unapproved publication must fail, got ${prematurePublication.statusCode}`);
    const assigned = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/assign', headers: auth, payload: { assigneeId: TEST_FIXTURES.admin.id } });
    assert(assigned.statusCode === 200, `Review assignment failed: ${assigned.statusCode} ${assigned.body}`);
    const approved = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/decisions', headers: auth, payload: { decision: 'approve' } });
    assert(approved.statusCode === 400, `Approval before in_review must fail, got ${approved.statusCode}`);
    const started = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/start', headers: auth });
    assert(started.statusCode === 200, `Review start failed: ${started.statusCode} ${started.body}`);
    const approvedAfterReview = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/decisions', headers: auth, payload: { decision: 'approve', reason: 'Verified' } });
    assert(approvedAfterReview.statusCode === 200, `Review approval failed: ${approvedAfterReview.statusCode} ${approvedAfterReview.body}`);
    const publication = await app.inject({ method: 'POST', url: '/api/v1/operational/reviews/review-e2e/publications', headers: auth, payload: { targetRepository: 'rocksoul-superhero', targetDomain: 'PERSON', sourceRef: 'superhero:PER-E2E' } });
    assert(publication.statusCode === 201, `Approved publication request failed: ${publication.statusCode} ${publication.body}`);
  } finally { await app.close(); }
}

if (process.argv[1]?.includes('05-operational-orm.test.ts')) runOperationalOrmTests().then(() => console.log('Operational ORM E2E passed'));
