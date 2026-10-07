#Requires -Version 5.1
<#
.SYNOPSIS
    Bring the latest RNZ brand layer into an existing Fabric app.

.DESCRIPTION
    Works for apps made from the RNZ template and for apps made elsewhere (first run
    adds the brand layer; then ask Copilot to "Rebrand this app to RNZ").
    Shows a preview first. Only brand-managed files change. Your screens, queries and
    App.tsx are never touched, files are never renamed or deleted, and anything it
    replaces is backed up to rnz\backup\<time>\ in the app.

.EXAMPLE
    .\scripts\update-app.ps1 -App C:\dev\pipeline-by-pillar
#>
[CmdletBinding()]
param(
    # The app's folder (the one with package.json)
    [Parameter(Mandatory = $true)]
    [string]$App,

    # Apply without asking
    [switch]$Yes,

    # Don't pull the latest template first
    [switch]$SkipPull,

    # Continue even if the app has uncommitted git changes
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$sync = Join-Path $repo 'templates\rnz-data-app\scripts\rnz-sync.mjs'

foreach ($cmd in 'node', 'npm.cmd', 'git') {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd wasn't found. Install it, then run this again." }
}
if (-not (Test-Path $sync)) { throw "Run this script from the rnz-fabric-apps repo. $sync wasn't found." }

$appPath = (Resolve-Path $App).Path
if (-not (Test-Path (Join-Path $appPath 'package.json'))) { throw "No package.json in $appPath. Point -App at the app's own folder." }
if ($appPath.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'That folder is inside the template repo. Point -App at an app folder, for example C:\dev\my-app.'
}

# Restore point: refuse to overwrite uncommitted work unless -Force.
& git -C $appPath rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -eq 0) {
    $changes = & git -C $appPath status --porcelain
    if ($changes -and -not $Force) {
        throw "The app has uncommitted changes. Commit them first so you can roll back (git add -A; git commit -m `"Before RNZ update`"), or run again with -Force."
    }
}
else {
    Write-Warning 'The app is not in git. Copy the folder somewhere safe before applying, so you can roll back.'
}

if (-not $SkipPull -and (Test-Path (Join-Path $repo '.git'))) {
    $templateChanges = & git -C $repo status --porcelain
    if ($templateChanges) { throw "The template folder has local changes, and it must stay exactly as published. Run: git -C `"$repo`" status" }
    Write-Host 'Getting the latest template...'
    & git -C $repo pull --ff-only
    if ($LASTEXITCODE -ne 0) { throw 'git pull failed. Check your connection and GitHub access, then try again.' }
}

Push-Location $appPath
try {
    & node $sync --from $repo
    if ($LASTEXITCODE -ne 0) { throw 'The preview failed. Read the messages above.' }

    if (-not $Yes) {
        $answer = Read-Host 'Apply these changes? (y/n)'
        if ($answer -notmatch '^(y|yes)$') { Write-Host 'Nothing changed.'; return }
    }

    & node $sync --from $repo --apply
    if ($LASTEXITCODE -ne 0) { throw 'The update failed. Read the messages above.' }

    # Add the RNZ npm scripts if the app doesn't have them. Never overwrite an app's own script.
    $pkg = Get-Content (Join-Path $appPath 'package.json') -Raw | ConvertFrom-Json
    $wanted = [ordered]@{
        'rnz:check'       = 'node scripts/rnz-check.mjs'
        'rnz:sync'        = 'node scripts/rnz-sync.mjs'
        'prebuild:fabric' = 'node scripts/rnz-check.mjs'
    }
    foreach ($key in $wanted.Keys) {
        $existing = $null
        if ($pkg.scripts) { $existing = $pkg.scripts.PSObject.Properties[$key] }
        if (-not $existing) {
            & npm.cmd pkg set "scripts.$key=$($wanted[$key])"
            Write-Host "Added npm script $key"
        }
        elseif ($existing.Value -ne $wanted[$key]) {
            Write-Warning "The app already has its own '$key' script ($($existing.Value)). Left as it is. Ask the template maintainer whether it should run the brand check."
        }
    }

    Write-Host 'Running the RNZ brand check...'
    & npm.cmd run rnz:check
}
finally { Pop-Location }

Write-Host ''
Write-Host 'Done. If this app was not made from the RNZ template, open it in VS Code and ask Copilot (Agent mode):'
Write-Host '  Rebrand this app to RNZ. Change the look only.'
