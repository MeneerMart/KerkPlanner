# Publiceert de backend en zet hem op Azure App Service.
# Gebruik: .\deploy-backend.ps1 -ResourceGroup kerkplanner-rg -AppName kerkplanner-api
param(
    [Parameter(Mandatory)] [string] $ResourceGroup,
    [Parameter(Mandatory)] [string] $AppName
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$publishDir = Join-Path $root 'Backend\bin\publish'
$zipPath = Join-Path $root 'Backend\bin\publish.zip'

if (Test-Path $publishDir) { Remove-Item -Recurse -Force $publishDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }

dotnet publish (Join-Path $root 'Backend\KerkPlanner.Api.csproj') -c Release -o $publishDir
if ($LASTEXITCODE -ne 0) { throw 'dotnet publish is mislukt.' }

# Lokale databasebestanden nooit meesturen; de productiedatabase staat in /home/data.
Get-ChildItem $publishDir -Filter '*.db*' | Remove-Item -Force

Compress-Archive -Path (Join-Path $publishDir '*') -DestinationPath $zipPath
az webapp deploy --resource-group $ResourceGroup --name $AppName --src-path $zipPath --type zip
if ($LASTEXITCODE -ne 0) { throw 'az webapp deploy is mislukt.' }

Write-Host "Klaar. Controleer: https://$AppName.azurewebsites.net/health"
