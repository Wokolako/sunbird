$ErrorActionPreference = "Stop"
if (-not $env:DIRECT_URL) { throw "DIRECT_URL is required." }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "PostgreSQL pg_dump is required and must be available on PATH."
}
$backupRoot = Join-Path $PSScriptRoot "..\data\backups"
$backupRoot = [System.IO.Path]::GetFullPath($backupRoot)
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupFile = Join-Path $backupRoot "vabbot-$timestamp.dump"
try {
  & pg_dump --format=custom --no-owner --no-privileges --file=$backupFile $env:DIRECT_URL
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }
  & node (Join-Path $PSScriptRoot "upload-backup.mjs") $backupFile
  if ($LASTEXITCODE -ne 0) { throw "Backup upload failed." }
  Write-Output "Backup completed and uploaded."
} finally {
  if (Test-Path -LiteralPath $backupFile) {
    Remove-Item -LiteralPath $backupFile -Force
  }
}
