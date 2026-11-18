use crate::db;
use serde::{Deserialize, Serialize};
use std::{
    path::Path,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::AppHandle;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentExecutionStep {
    pub id: String,
    pub run_id: String,
    pub step_index: i64,
    pub kind: String,
    pub summary: String,
    pub status: String,
    pub payload_json: String,
    pub output_text: String,
    pub error_text: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSupervisorStatus {
    pub run_id: String,
    pub pid: Option<i64>,
    pub status: String,
    pub worktree_path: String,
    pub timeout_seconds: i64,
    pub heartbeat_at: String,
    pub started_at: String,
    pub ended_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentRunExecutionResult {
    pub run_id: String,
    pub status: String,
    pub exit_code: Option<i64>,
    pub summary: String,
    pub changed_files: Vec<String>,
    pub diff_stat: String,
}

fn redact_secrets(input: &str) -> String {
    let mut sanitized = input.to_string();
    let keywords = ["ghp_", "gho_", "bearer ", "Bearer ", "password=", "secret="];
    for keyword in keywords {
        if let Some(pos) = sanitized.find(keyword) {
            let start = pos + keyword.len();
            let end = sanitized[start..]
                .find(|c: char| c.is_whitespace() || c == '"' || c == '\'')
                .map(|offset| start + offset)
                .unwrap_or(sanitized.len());
            sanitized.replace_range(start..end, "[REDACTED]");
        }
    }
    sanitized
}

#[tauri::command]
pub async fn discover_local_providers() -> Result<Vec<String>, String> {
    let mut available = Vec::new();
    let candidates = [
        ("git", ["--version"]),
        ("node", ["--version"]),
        ("pnpm", ["--version"]),
        ("cargo", ["--version"]),
        ("gh", ["--version"]),
    ];

    for (executable, args) in candidates {
        if Command::new(executable).args(args).output().is_ok() {
            available.push(executable.to_string());
        }
    }

    Ok(available)
}

#[tauri::command]
pub async fn start_supervised_agent_run(
    app: AppHandle,
    agent_id: String,
    repository_id: String,
    worktree_path: String,
    prompt: String,
) -> Result<AgentSupervisorStatus, String> {
    let safe_prompt = redact_secrets(&prompt);
    let worktree_dir = Path::new(&worktree_path);
    if !worktree_dir.exists() || !worktree_dir.is_dir() {
        return Err(format!(
            "Worktree path must exist and be an isolated directory: {worktree_path}"
        ));
    }

    let connection = db::connect(&app)?;
    let run_id = Uuid::new_v4().to_string();
    let supervisor_id = Uuid::new_v4().to_string();
    let branch_name = format!("agent/{}", &run_id[..8]);

    let transaction = connection
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "INSERT INTO agent_runs (id, agent_id, repository_id, worktree_path, branch_name, prompt, status, started_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'running', CURRENT_TIMESTAMP)",
            rusqlite::params![run_id, agent_id, repository_id, worktree_path, branch_name, safe_prompt],
        )
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "INSERT INTO agent_supervisors (id, run_id, pid, status, worktree_path, timeout_seconds, heartbeat_at, started_at)
             VALUES (?1, ?2, NULL, 'running', ?3, 600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            rusqlite::params![supervisor_id, run_id, worktree_path],
        )
        .map_err(|e| e.to_string())?;

    let step_id = Uuid::new_v4().to_string();
    transaction
        .execute(
            "INSERT INTO agent_execution_steps (id, run_id, step_index, kind, summary, status, payload_json, output_text)
             VALUES (?1, ?2, 1, 'init', 'Agent process supervisor initialized in worktree', 'completed', '{}', ?3)",
            rusqlite::params![step_id, run_id, format!("Target worktree: {worktree_path}")],
        )
        .map_err(|e| e.to_string())?;

    transaction.commit().map_err(|e| e.to_string())?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
        .to_string();

    Ok(AgentSupervisorStatus {
        run_id,
        pid: None,
        status: "running".to_string(),
        worktree_path,
        timeout_seconds: 600,
        heartbeat_at: timestamp.clone(),
        started_at: timestamp,
        ended_at: None,
    })
}

#[tauri::command]
pub async fn cancel_supervised_agent_run(
    app: AppHandle,
    run_id: String,
) -> Result<AgentSupervisorStatus, String> {
    let connection = db::connect(&app)?;
    let transaction = connection
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "UPDATE agent_runs SET status = 'cancelled', finished_at = CURRENT_TIMESTAMP WHERE id = ?1",
            rusqlite::params![run_id],
        )
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "UPDATE agent_supervisors SET status = 'killed', ended_at = CURRENT_TIMESTAMP WHERE run_id = ?1",
            rusqlite::params![run_id],
        )
        .map_err(|e| e.to_string())?;

    let step_id = Uuid::new_v4().to_string();
    let next_index: i64 = transaction
        .query_row(
            "SELECT COALESCE(MAX(step_index), 0) + 1 FROM agent_execution_steps WHERE run_id = ?1",
            rusqlite::params![run_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    transaction
        .execute(
            "INSERT INTO agent_execution_steps (id, run_id, step_index, kind, summary, status, output_text)
             VALUES (?1, ?2, ?3, 'cancellation', 'Agent run cancelled by supervisor policy', 'cancelled', 'Cleaned up process supervisor and boundaries')",
            rusqlite::params![step_id, run_id, next_index],
        )
        .map_err(|e| e.to_string())?;

    transaction.commit().map_err(|e| e.to_string())?;

    Ok(AgentSupervisorStatus {
        run_id,
        pid: None,
        status: "killed".to_string(),
        worktree_path: String::new(),
        timeout_seconds: 600,
        heartbeat_at: String::new(),
        started_at: String::new(),
        ended_at: Some("now".to_string()),
    })
}

#[tauri::command]
pub async fn get_agent_execution_steps(
    app: AppHandle,
    run_id: String,
) -> Result<Vec<AgentExecutionStep>, String> {
    let connection = db::connect(&app)?;
    let mut stmt = connection
        .prepare(
            "SELECT id, run_id, step_index, kind, summary, status, payload_json, output_text, error_text, created_at, updated_at
             FROM agent_execution_steps WHERE run_id = ?1 ORDER BY step_index ASC",
        )
        .map_err(|e| e.to_string())?;

    let steps = stmt
        .query_map(rusqlite::params![run_id], |row| {
            Ok(AgentExecutionStep {
                id: row.get(0)?,
                run_id: row.get(1)?,
                step_index: row.get(2)?,
                kind: row.get(3)?,
                summary: row.get(4)?,
                status: row.get(5)?,
                payload_json: row.get(6)?,
                output_text: row.get(7)?,
                error_text: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(steps)
}

#[tauri::command]
pub async fn evaluate_agent_worktree_evidence(
    worktree_path: String,
) -> Result<AgentRunExecutionResult, String> {
    let worktree_dir = Path::new(&worktree_path);
    if !worktree_dir.exists() || !worktree_dir.is_dir() {
        return Err(format!("Invalid worktree directory: {worktree_path}"));
    }

    let status_output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(worktree_dir)
        .output()
        .map_err(|e| format!("Failed to run git status: {e}"))?;

    let changed = String::from_utf8_lossy(&status_output.stdout);
    let changed_files: Vec<String> = changed
        .lines()
        .filter(|line| line.len() > 3)
        .map(|line| line[3..].trim().to_string())
        .collect();

    let diff_output = Command::new("git")
        .args(["diff", "--stat"])
        .current_dir(worktree_dir)
        .output()
        .map_err(|e| format!("Failed to run git diff: {e}"))?;

    let diff_stat = String::from_utf8_lossy(&diff_output.stdout)
        .trim()
        .to_string();

    Ok(AgentRunExecutionResult {
        run_id: Uuid::new_v4().to_string(),
        status: "completed".to_string(),
        exit_code: Some(0),
        summary: format!("Captured {} changed files in worktree", changed_files.len()),
        changed_files,
        diff_stat,
    })
}
