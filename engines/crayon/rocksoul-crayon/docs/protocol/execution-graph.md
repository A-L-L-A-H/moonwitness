# Execution graph contract

The SDK graph is a local, deterministic composition of semantic executions;
it is not a remotely interpreted workflow language. Nodes have stable
`graphId`, `nodeId`, `executionId`, and `requestId` correlation fields.

A graph schedules dependency-ready nodes in waves. Independent nodes may run in
parallel; a failed or cancelled node causes dependent nodes to become
`skipped`. Completed nodes are preserved. Cancelling a graph stops future
 scheduling and cancels only running executions that support cancellation.

Graph results are individually addressable and report `success`, `failed`,
`cancelled`, or `skipped`. Retry and timeout policy belongs to the node
execution and must not imply transactional rollback.
