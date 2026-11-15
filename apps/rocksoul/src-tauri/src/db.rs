use rusqlite::{params, Connection};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};
use uuid::Uuid;

pub fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join("rocksoul.sqlite3"))
}

pub fn connect(app: &AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    let connection = Connection::open(path).map_err(|error| error.to_string())?;
    connection
        .busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|error| error.to_string())?;
    connection
        .pragma_update(None, "foreign_keys", "ON")
        .map_err(|error| error.to_string())?;
    Ok(connection)
}

pub fn init(app: &AppHandle) -> Result<(), String> {
    let connection = connect(app)?;
    connection
        .pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| error.to_string())?;
    migrate(&connection)?;

    connection.execute(
        "INSERT OR IGNORE INTO workspaces (id, name, root_path) VALUES ('local', 'LOCAL WORKSPACE', NULL)",
        [],
    ).map_err(|error| error.to_string())?;

    Ok(())
}

fn migrate(connection: &Connection) -> Result<(), String> {
    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;
    transaction
        .execute_batch(include_str!("../migrations/001_init.sql"))
        .map_err(|error| error.to_string())?;
    let has_issues_table: bool = transaction
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'issues')",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;
    if has_issues_table {
        let closed_at_exists: bool = transaction
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM pragma_table_info('issues') WHERE name = 'closed_at')",
                [],
                |row| row.get(0),
            )
            .map_err(|error| error.to_string())?;
        if !closed_at_exists {
            transaction
                .execute_batch(include_str!("../migrations/002_local_workflows.sql"))
                .map_err(|error| error.to_string())?;
        }
    }
    let version: i64 = transaction
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;
    if version < 3 {
        transaction
            .execute_batch(include_str!("../migrations/003_google_drive_backup.sql"))
            .map_err(|error| error.to_string())?;
    }
    transaction
        .pragma_update(None, "user_version", 3)
        .map_err(|error| error.to_string())?;
    transaction.commit().map_err(|error| error.to_string())
}

pub fn record_event(
    connection: &Connection,
    kind: &str,
    message: &str,
    metadata: &str,
) -> Result<(), String> {
    connection
        .execute(
            "INSERT INTO events (id, kind, message, metadata) VALUES (?1, ?2, ?3, ?4)",
            params![Uuid::new_v4().to_string(), kind, message, metadata],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::migrate;
    use rusqlite::Connection;

    #[test]
    fn initial_schema_creates_the_local_workflow_tables() {
        let connection = Connection::open_in_memory().expect("in-memory SQLite should open");
        connection
            .execute_batch(include_str!("../migrations/001_init.sql"))
            .expect("initial migration should apply");

        for table in ["workspaces", "projects", "repositories", "issues", "events"] {
            let exists: i64 = connection
                .query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = ?1",
                    [table],
                    |row| row.get(0),
                )
                .expect("table lookup should work");
            assert_eq!(exists, 1, "missing table: {table}");
        }
    }

    #[test]
    fn migration_preserves_existing_issues_and_is_idempotent() {
        let connection = Connection::open_in_memory().expect("in-memory SQLite should open");
        connection
            .execute_batch(include_str!("../migrations/001_init.sql"))
            .expect("base schema should apply");
        connection
            .execute(
                "INSERT INTO workspaces (id, name) VALUES ('local', 'Local')",
                [],
            )
            .expect("workspace should insert");
        connection.execute("INSERT INTO issues (id, issue_key, title) VALUES ('i1', 'DX-001', 'Existing issue')", [])
            .expect("existing issue should insert");
        migrate(&connection).expect("migration should apply");
        migrate(&connection).expect("repeat migration should be a no-op");

        let closed_at_column: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('issues') WHERE name = 'closed_at'",
                [],
                |row| row.get(0),
            )
            .expect("column metadata should load");
        let issue_title: String = connection
            .query_row("SELECT title FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .expect("existing issue should remain");
        let version: i64 = connection
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .expect("schema version should load");
        assert_eq!(closed_at_column, 1);
        let backup_table: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'cloud_backup_settings'",
                [],
                |row| row.get(0),
            )
            .expect("cloud backup settings table should exist");
        assert_eq!(issue_title, "Existing issue");
        assert_eq!(backup_table, 1);
        assert_eq!(version, 3);
    }

    #[test]
    fn migration_from_the_legacy_schema_preserves_agent_tables_and_records() {
        let connection = Connection::open_in_memory().expect("in-memory SQLite should open");
        connection
            .execute_batch(include_str!("../migrations/001_init.sql"))
            .expect("legacy schema should apply");
        connection
            .execute(
                "INSERT INTO workspaces (id, name) VALUES ('local', 'Local')",
                [],
            )
            .expect("workspace should insert");
        connection.execute(
            "INSERT INTO issues (id, issue_key, title) VALUES ('i1', 'DX-001', 'Existing issue')",
            [],
        ).expect("legacy issue should insert");
        connection.execute(
            "INSERT INTO agents (id, name, role, provider, executable) VALUES ('a1', 'Legacy agent', 'builder', 'legacy', 'legacy')",
            [],
        ).expect("legacy agent record should insert");
        migrate(&connection).expect("additive migration should apply");

        let (issue_title, agent_name): (String, String) = connection.query_row(
            "SELECT issues.title, agents.name FROM issues JOIN agents ON agents.id = 'a1' WHERE issues.id = 'i1'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).expect("legacy records should remain");
        assert_eq!(issue_title, "Existing issue");
        assert_eq!(agent_name, "Legacy agent");
    }

    #[test]
    fn migration_repairs_a_partial_legacy_upgrade_without_losing_records() {
        let connection = Connection::open_in_memory().expect("in-memory SQLite should open");
        connection
            .execute_batch(include_str!("../migrations/001_init.sql"))
            .expect("base schema should apply");
        connection
            .execute(
                "INSERT INTO workspaces (id, name) VALUES ('local', 'Local')",
                [],
            )
            .expect("workspace should insert");
        connection
            .execute(
                "INSERT INTO issues (id, issue_key, title) VALUES ('i1', 'DX-001', 'Kept issue')",
                [],
            )
            .expect("issue should insert");
        migrate(&connection).expect("legacy migration should complete");
        migrate(&connection).expect("repeat migration should be idempotent");

        let closed_at_columns: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('issues') WHERE name = 'closed_at'",
                [],
                |row| row.get(0),
            )
            .expect("column metadata should load");
        let version: i64 = connection
            .query_row("PRAGMA user_version", [], |row| row.get(0))
            .expect("schema version should load");
        assert_eq!(closed_at_columns, 1);
        assert_eq!(version, 3);
        let title: String = connection
            .query_row("SELECT title FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .expect("legacy issue should remain");
        assert_eq!(title, "Kept issue");
    }

    #[test]
    fn migration_recognizes_an_already_upgraded_unversioned_database() {
        let connection = Connection::open_in_memory().expect("in-memory SQLite should open");
        connection
            .execute_batch(include_str!("../migrations/001_init.sql"))
            .expect("legacy schema should apply");
        connection
            .execute_batch(include_str!("../migrations/002_local_workflows.sql"))
            .expect("workflow migration should apply");
        connection.execute("INSERT INTO issues (id, issue_key, title) VALUES ('i1', 'DX-001', 'Existing issue')", [])
            .expect("existing issue should insert");

        migrate(&connection).expect("already-applied migration should be recognized");

        let closed_at_columns: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM pragma_table_info('issues') WHERE name = 'closed_at'",
                [],
                |row| row.get(0),
            )
            .expect("column metadata should load");
        let title: String = connection
            .query_row("SELECT title FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .expect("existing issue should remain");
        assert_eq!(closed_at_columns, 1);
        assert_eq!(title, "Existing issue");
    }
}
