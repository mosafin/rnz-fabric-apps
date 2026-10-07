#Requires -Version 5.1
<#
.SYNOPSIS
    Create a new RNZ Fabric app from the RNZ Data App template.

.DESCRIPTION
    Pulls the latest template, creates the app outside OneDrive, runs the RNZ brand
    check and opens it in VS Code. The template folder itself is never changed.

.EXAMPLE
    .\scripts\new-app.ps1 -Name pipeline-by-pillar -WorkspaceId 00000000-0000-0000-0000-000000000000

.EXAMPLE
    .\scripts\new-app.ps1 -Name pipeline-by-pillar
    (No workspace yet: the app is created and you pick the workspace when you deploy.)
#>
[CmdletBinding()]
param(
    # App folder name: lower case letters, numbers and hyphens, e.g. pipeline-by-pillar
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')]
    [string]$Name,

    # Fabric workspace ID: the GUID after /groups/ in the workspace URL
    [ValidatePattern('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')]
    [string]$WorkspaceId,

    # Where the app folder is created. Keep it outside OneDrive.
    [string]$Parent = 'C:\dev',

    # Don't pull the latest template first
    [switch]$SkipPull,

    # Don't open VS Code at the end
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot

function Assert-Command([string]$cmd, [string]$hint) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd wasn't found. $hint" }
}

Assert-Command 'node' 'Install Node.js 20 or later from https://nodejs.org, then run this again.'
Assert-Command 'npm.cmd' 'Install Node.js 20 or later from https://nodejs.org, then run this again.'
Assert-Command 'git' 'Install Git from https://git-scm.com, then run this again.'

$nodeMajor = [int]((& node -v).TrimStart('v').Split('.')[0])
if ($nodeMajor -lt 20) { throw "Node.js 20 or later is needed. This computer has $(& node -v)." }

if (-not (Test-Path (Join-Path $repo 'rayfin-template.yml'))) {
    throw "Run this script from the rnz-fabric-apps repo (scripts\new-app.ps1). $repo isn't the template repo."
}

if ($Parent -match 'OneDrive') {
    Write-Warning "$Parent is inside OneDrive. OneDrive syncs every installed package and can lock files during builds. C:\dev is recommended."
}

if (-not $SkipPull) {
    if (Test-Path (Join-Path $repo '.git')) {
        $changes = & git -C $repo status --porcelain
        if ($changes) {
            throw "The template folder has local changes, and it must stay exactly as published. Run: git -C `"$repo`" status"
        }
        Write-Host 'Getting the latest template...'
        & git -C $repo pull --ff-only
        if ($LASTEXITCODE -ne 0) { throw 'git pull failed. Check your connection and GitHub access, then try again.' }
    }
    else {
        Write-Warning 'The template folder is not a git clone, so it was not updated. Use a clone to get updates.'
    }
}

$version = (Get-Content (Join-Path $repo 'templates\rnz-data-app\rnz\brand-manifest.json') -Raw | ConvertFrom-Json).templateVersion
Write-Host "Template version $version"

New-Item -ItemType Directory -Force -Path $Parent | Out-Null
$target = Join-Path $Parent $Name
if (Test-Path $target) { throw "$target already exists. Choose another -Name." }

# npm.cmd, not npm: Windows PowerShell drops the '--' separator when it calls npm.ps1.
$createArgs = @('create', '@microsoft/rayfin@latest', '--', $Name, '--template', $repo, '--template-name', 'RNZ Data App')
if ($WorkspaceId) { $createArgs += @('--workspace-id', $WorkspaceId) }

Write-Host "Creating $target ..."
if ($WorkspaceId) { Write-Host 'If a browser window asks you to sign in to Fabric, sign in and come back here.' }
Push-Location $Parent
try {
    & npm.cmd @createArgs
    if ($LASTEXITCODE -ne 0) { throw "Creating the app failed (exit code $LASTEXITCODE). Read the messages above." }
}
finally { Pop-Location }

Push-Location $target
try {
    Write-Host 'Running the RNZ brand check...'
    & npm.cmd run rnz:check
    if ($LASTEXITCODE -ne 0) { Write-Warning 'The brand check found errors in the new app. Tell the template maintainer.' }
}
finally { Pop-Location }

Write-Host ''
Write-Host "Done. Your app is in $target"
Write-Host 'Next: in VS Code, open Copilot Chat in Agent mode and type:'
Write-Host '  Build this RNZ app. It is for [who] to see [what]. Model: [share link]. Pillar: [pillar or none].'

if (-not $NoOpen) {
    if (Get-Command code -ErrorAction SilentlyContinue) { & code $target }
    else { Write-Host "Open the folder $target in VS Code." }
}
