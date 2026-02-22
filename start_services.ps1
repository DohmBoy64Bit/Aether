Write-Host "Starting Aether Services..." -ForegroundColor Cyan

# Start Podman machine if not running
Write-Host "Checking Podman status..." -ForegroundColor Yellow
$podmanInfo = podman info 2>&1
if ($LASTEXITCODE -ne 0 -or $podmanInfo -match "error" -or $podmanInfo -match "connection refused" -or $podmanInfo -match "machine is not running") {
    Write-Host "Podman is offline. Attempting to start the default Podman machine..." -ForegroundColor Cyan
    podman machine start
    Write-Host "Waiting for Podman to start (this usually takes 10-20 seconds)..." -ForegroundColor Yellow
    $podmanReady = $false
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2
        $check = podman info 2>&1
        if ($LASTEXITCODE -eq 0 -and $check -notmatch "error" -and $check -notmatch "machine is not running") {
            $podmanReady = $true
            break
        }
        Write-Host "." -NoNewline
    }
    Write-Host ""
    if (-not $podmanReady) {
        Write-Host "WARNING: Podman didn't respond in time. The containers may fail to start." -ForegroundColor Red
    }
    else {
        Write-Host "Podman is now online!" -ForegroundColor Green
    }
}
else {
    Write-Host "Podman is online." -ForegroundColor Green
}

# Start Container Services (SearXNG & ChromaDB)
Write-Host "Starting Podman Containers (SearXNG & ChromaDB) in a new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"podman compose up`""

# Start Ollama
Write-Host "Starting Ollama..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"ollama serve`""

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd backend; npm run dev`""

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Services launched in separate windows!" -ForegroundColor Cyan
