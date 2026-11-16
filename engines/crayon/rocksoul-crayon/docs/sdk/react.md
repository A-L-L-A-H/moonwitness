# React integration boundary

The core SDK is framework-independent. React bindings should adapt core
resource, execution, and subscription observers rather than become the source
of state or protocol semantics. Components should consume typed resource data,
normalized execution states, and application events; they should not decode
AEP frames or construct transport URLs.

Until dedicated hooks are added, feature code should use the shared application
facade and keep compatibility API calls isolated to authentication and domain
operations that have not yet received native capabilities.
