$ErrorActionPreference = "Stop"
$rustupPath = "$env:USERPROFILE\.rustup\toolchains"
$stableToolchain = Get-ChildItem $rustupPath -Directory | Where-Object { $_.Name -match "stable" } | Select-Object -First 1
if ($stableToolchain) {
    $cargoBin = "$($stableToolchain.FullName)\bin"
    $env:Path = "$cargoBin;$env:Path"
}

$env:RUSTUP_HOME = "$env:USERPROFILE\.rustup"
$env:CARGO_HOME = "$env:USERPROFILE\.cargo"

Write-Host "Building Tauri app..."
cd "C:\Users\domin\Desktop\Dashboard\apps\web"
pnpm tauri build
