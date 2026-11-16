# Organization runtime

Organizations use the generic metadata resource runtime at `/organizations`. The backend registry provides organization CRUD metadata and the authorization kernel remains authoritative for read/create/update/delete. The settings organization context surface uses the server-authoritative membership list and context-switch endpoint; unauthorized membership changes are rejected by the API.
