mod commands;
mod db;
mod models;

use crate::commands::repositories;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(commands::s3_gateway::S3GatewayState::default())
        .setup(|app| {
            db::init(app.handle()).map_err(std::io::Error::other)?;
            let _ = repositories::ensure_default_workspace_repository(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::cloud_backup::cloud_backup_status,
            commands::cloud_backup::connect_google_drive,
            commands::cloud_backup::disconnect_google_drive,
            commands::cloud_backup::backup_to_google_drive,
            commands::cloud_backup::restore_from_google_drive,
            commands::s3_gateway::s3_gateway_status,
            commands::s3_gateway::start_s3_gateway,
            commands::s3_gateway::stop_s3_gateway,
            commands::system::get_dashboard,
            commands::system::list_events,
            commands::monitor::get_monitor_snapshot,
            commands::monitor::open_ecosystem_url,
            commands::issues::list_issues,
            commands::issues::create_issue,
            commands::issues::update_issue,
            commands::issues::delete_issue,
            commands::issues::set_issue_status,
            commands::projects::list_projects,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,
            commands::milestones::list_milestones,
            commands::milestones::create_milestone,
            commands::milestones::update_milestone,
            commands::milestones::delete_milestone,
            commands::milestones::set_milestone_status,
            commands::repositories::list_repositories,
            commands::repositories::add_repository,
            commands::repositories::git_snapshot,
            commands::repositories::git_execute,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ROCKSOUL - DX");
}
