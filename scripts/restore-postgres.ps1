$ErrorActionPreference = "Stop"
if ($env:RESTORE_APPROVED -ne "true") {
  throw "Set RESTORE_APPROVED=true only after confirming the target database and maintenance window."
}
if (-not $env:DIRECT_URL) { throw "DIRECT_URL is required." }
if (-not $env:BACKUP_FILE) { throw "BACKUP_FILE must point to a downloaded PostgreSQL custom-format backup." }
if (-not (Test-Path -LiteralPath $env:BACKUP_FILE)) { throw "BACKUP_FILE does not exist." }
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "PostgreSQL pg_restore is required and must be available on PATH."
}
& pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error --dbname=$env:DIRECT_URL $env:BACKUP_FILE
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed." }
Write-Output "Restore completed. Run npm run db:verify before restoring application traffic."
