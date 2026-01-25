Param(
  [string]$OrtDylib = $env:LITOMI_ORT_DYLIB
)

$ErrorActionPreference = "Stop"

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Bin = Join-Path $RootDir "bin\\litomi-local-search.exe"
$DataDir = Join-Path $RootDir "data"

if (-not (Test-Path $Bin)) {
  Write-Error "Binary not found: $Bin`nBuild it first: cargo build --release --manifest-path local-search/Cargo.toml"
}

if ($OrtDylib -and (Test-Path $OrtDylib)) {
  & $Bin serve --data-dir $DataDir --ort-dylib $OrtDylib
} else {
  & $Bin serve --data-dir $DataDir
}

