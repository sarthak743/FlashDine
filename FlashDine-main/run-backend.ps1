param(
  [switch]$Install,
  [int]$Port
)

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Join-Path $projectRoot 'server'

if (-not (Test-Path (Join-Path $serverDir 'package.json'))) {
  Write-Error "Backend package.json not found at $serverDir"
  exit 1
}

Push-Location $serverDir

try {
  if ($Install -or -not (Test-Path (Join-Path $serverDir 'node_modules'))) {
    Write-Host 'Installing backend dependencies...'
    npm install
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  }

  if ($Port) {
    $env:PORT = [string]$Port
    Write-Host "Using backend port $Port"
  }

  Write-Host 'Starting backend in watch mode...'
  npm run dev
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}