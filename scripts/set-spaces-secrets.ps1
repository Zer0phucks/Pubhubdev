# PowerShell script to set Spaces secrets in DigitalOcean App Platform
# This script uses the DigitalOcean API to set secrets

$appId = "aff826e7-0fa7-4ba5-b326-ec4d84546475"
$spacesAccessKey = "DO801GMJF7GNBBLE28KU"
$spacesSecretKey = "Iv/cjLDMDU8HunqP+tyR1+QygthZR9kGLUSwPqaRb8g"

# Get access token from doctl config
$configPath = "$env:APPDATA\doctl\config.yaml"
if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw
    if ($config -match "access-token:\s*(.+)") {
        $token = $matches[1].Trim()
        Write-Host "Found access token in doctl config"
    } else {
        Write-Host "Could not find access token in doctl config"
        Write-Host "Please set SPACES_ACCESS_KEY and SPACES_SECRET_KEY manually in DigitalOcean App Platform console"
        exit 1
    }
} else {
    Write-Host "Could not find doctl config file"
    Write-Host "Please set SPACES_ACCESS_KEY and SPACES_SECRET_KEY manually in DigitalOcean App Platform console"
    exit 1
}

Write-Host "Note: DigitalOcean App Platform secrets must be set through the console UI"
Write-Host "Go to: https://cloud.digitalocean.com/apps/$appId/settings/secrets"
Write-Host ""
Write-Host "Set these secrets:"
Write-Host "  SPACES_ACCESS_KEY = $spacesAccessKey"
Write-Host "  SPACES_SECRET_KEY = $spacesSecretKey"

