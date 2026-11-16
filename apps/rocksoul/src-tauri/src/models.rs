use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudBackupStatus {
    pub available: bool,
    pub connected: bool,
    pub account: Option<String>,
    pub last_backup_at: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct S3GatewayStatus {
    pub running: bool,
    pub endpoint: Option<String>,
    pub bucket: String,
    pub access_key: Option<String>,
    pub secret_key: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Issue {
    pub id: String,
    pub issue_key: String,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub status: String,
    pub assignee: String,
    pub project_id: Option<String>,
    pub repository_id: Option<String>,
    pub repository_name: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub path: String,
    pub remote_url: String,
    pub default_branch: String,
    pub branch: String,
}

#[derive(Debug, Serialize)]
pub struct Event {
    pub id: String,
    pub kind: String,
    pub message: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub active: i64,
    pub blocked: i64,
    pub completed: i64,
}

#[derive(Debug, Serialize)]
pub struct Dashboard {
    pub stats: DashboardStats,
    pub issues: Vec<Issue>,
    pub repositories: Vec<Repository>,
    pub events: Vec<Event>,
}

#[derive(Debug, Serialize)]
pub struct GitSnapshot {
    pub name: String,
    pub branch: String,
    pub view: String,
    pub output: String,
}

#[derive(Debug, Serialize)]
pub struct Milestone {
    pub id: String,
    pub project_id: String,
    pub project_name: String,
    pub title: String,
    pub description: String,
    pub due_at: Option<String>,
    pub status: String,
}
