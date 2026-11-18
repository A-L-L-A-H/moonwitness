mod commands;
mod db;
mod models;
pub mod rocksoul_contracts;

use crate::commands::repositories;

/// Chromium flags that keep WebView2 on the hardware GPU path (D3D11 via ANGLE)
/// so the WebGL2 cinematic renderer is rasterized and composited on the GPU.
#[cfg(windows)]
const WEBVIEW2_GPU_ARGUMENTS: &str =
    "--ignore-gpu-blocklist --enable-gpu-rasterization --enable-zero-copy --use-angle=d3d11";

#[cfg(windows)]
fn enable_webview_gpu_acceleration() {
    if std::env::var_os("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").is_none() {
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            WEBVIEW2_GPU_ARGUMENTS,
        );
    }
}

#[cfg(not(windows))]
fn enable_webview_gpu_acceleration() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    enable_webview_gpu_acceleration();
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
            commands::orchestration::create_orchestration_plan,
            commands::orchestration::add_orchestration_tasks,
            commands::orchestration::get_orchestration_tasks,
            commands::orchestration::update_orchestration_plan_status,
            commands::orchestration::step_orchestration_cycle,
            commands::agent_execution::discover_local_providers,
            commands::agent_execution::start_supervised_agent_run,
            commands::agent_execution::cancel_supervised_agent_run,
            commands::agent_execution::get_agent_execution_steps,
            commands::agent_execution::evaluate_agent_worktree_evidence,
            commands::continuity::capture_memory,
            commands::continuity::create_memory,
            commands::continuity::search_memories,
            commands::continuity::update_memory,
            commands::continuity::delete_memory,
            commands::continuity::create_work_session,
            commands::continuity::list_work_sessions,
            commands::continuity::close_work_session,
            commands::continuity::create_resume_point,
            commands::continuity::list_resume_points,
            commands::continuity::create_experience,
            commands::continuity::create_lesson,
            commands::continuity::resolve_lesson,
            commands::continuity::list_soul_journal,
            commands::s3_gateway::s3_gateway_status,
            commands::s3_gateway::start_s3_gateway,
            commands::s3_gateway::stop_s3_gateway,
            commands::system::await_mid_loopback_callback,
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
