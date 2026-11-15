$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot

try {
    $checks = @(
        @{ Name = "Frozen dependency install"; Command = "pnpm.cmd"; Arguments = @("install", "--frozen-lockfile") },
        @{ Name = "Dependency security audit"; Command = "pnpm.cmd"; Arguments = @("audit", "--audit-level", "high") },
        @{ Name = "Project configuration validation"; Command = "pnpm.cmd"; Arguments = @("check:config") },
        @{ Name = "Frontend dependency boundaries"; Command = "pnpm.cmd"; Arguments = @("check:boundaries") },
        @{ Name = "Native command contract parity"; Command = "pnpm.cmd"; Arguments = @("check:commands") },
        @{ Name = "Frontend lint"; Command = "pnpm.cmd"; Arguments = @("lint") },
        @{ Name = "Frontend TypeScript typecheck"; Command = "pnpm.cmd"; Arguments = @("typecheck") },
        @{ Name = "Frontend tests and coverage"; Command = "pnpm.cmd"; Arguments = @("test:coverage") },
        @{ Name = "Frontend production build"; Command = "pnpm.cmd"; Arguments = @("build") },
        @{ Name = "Rust formatting"; Command = "cargo"; Arguments = @("fmt", "--manifest-path", "src-tauri/Cargo.toml", "--", "--check", "--style-edition", "2021") },
        @{ Name = "Rust tests"; Command = "cargo"; Arguments = @("test", "--manifest-path", "src-tauri/Cargo.toml", "--locked") },
        @{ Name = "Rust check"; Command = "cargo"; Arguments = @("check", "--manifest-path", "src-tauri/Cargo.toml", "--locked") },
        @{ Name = "Rust Clippy"; Command = "cargo"; Arguments = @("clippy", "--manifest-path", "src-tauri/Cargo.toml", "--locked", "--all-targets", "--all-features", "--", "-D", "warnings") },
        @{ Name = "Patch whitespace"; Command = "git"; Arguments = @("diff", "--check") }
    )

    foreach ($check in $checks) {
        Write-Host "`n=== $($check.Name) ===" -ForegroundColor Cyan
        & $check.Command @($check.Arguments)
        if ($LASTEXITCODE -ne 0) {
            throw "$($check.Name) failed with exit code $LASTEXITCODE."
        }
    }

    Write-Host "`nALL LOCAL QUALITY GATES PASSED." -ForegroundColor Green
    Write-Host "Frontend coverage report: coverage/index.html" -ForegroundColor Green
}
catch {
    Write-Error $_
    exit 1
}
finally {
    Pop-Location
}
