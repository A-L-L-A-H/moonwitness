use tauri::AppHandle;

use crate::{
    commands::{issues::query_issues, repositories::query_repositories},
    db,
    models::{Dashboard, DashboardStats, Event},
};

pub fn query_events(connection: &rusqlite::Connection) -> Result<Vec<Event>, String> {
    let mut statement = connection.prepare(
        "SELECT id, kind, message, created_at FROM events ORDER BY created_at DESC, rowid DESC LIMIT 100"
    ).map_err(|error| error.to_string())?;
    let rows = statement
        .query_map([], |row| {
            Ok(Event {
                id: row.get(0)?,
                kind: row.get(1)?,
                message: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|error| error.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn list_events(app: AppHandle) -> Result<Vec<Event>, String> {
    let connection = db::connect(&app)?;
    query_events(&connection)
}

#[tauri::command]
pub fn get_dashboard(app: AppHandle) -> Result<Dashboard, String> {
    let connection = db::connect(&app)?;
    let active: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM issues WHERE status NOT IN ('done', 'closed')",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    Ok(Dashboard {
        stats: DashboardStats {
            active,
            blocked: connection
                .query_row(
                    "SELECT COUNT(*) FROM issues WHERE status = 'blocked'",
                    [],
                    |row| row.get(0),
                )
                .map_err(|error| error.to_string())?,
            completed: connection
                .query_row(
                    "SELECT COUNT(*) FROM issues WHERE status IN ('done', 'closed')",
                    [],
                    |row| row.get(0),
                )
                .map_err(|error| error.to_string())?,
        },
        issues: query_issues(&connection)?,
        repositories: query_repositories(&connection)?,
        events: query_events(&connection)?,
    })
}
