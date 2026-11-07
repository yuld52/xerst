# Configure DATABASE_URL and SECRET_KEY in the environment or backend .env file.
Push-Location $PSScriptRoot

if (-not $env:DATABASE_URL -and -not (Test-Path ".env")) {
    Write-Error "DATABASE_URL is required. Set it in the environment or create a backend .env file."
    exit 1
}
if (-not $env:SECRET_KEY -and -not (Test-Path ".env")) {
    Write-Error "SECRET_KEY is required. Set it in the environment or create a backend .env file."
    exit 1
}
if (-not $env:META_GRAPH_API_VERSION) {
    $env:META_GRAPH_API_VERSION = "v25.0"
}

Write-Host "Iniciando backend do Log Pose..."
Write-Host "Banco: configured by DATABASE_URL"
Write-Host "URL: http://localhost:8000"
Write-Host ""

$pythonCmd = "python"
if (Test-Path "..\.venv\Scripts\python.exe") {
    $pythonCmd = "..\.venv\Scripts\python.exe"
} elseif (Test-Path ".\.venv\Scripts\python.exe") {
    $pythonCmd = ".\.venv\Scripts\python.exe"
}

& $pythonCmd -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
$backendExitCode = $LASTEXITCODE
Pop-Location
exit $backendExitCode
