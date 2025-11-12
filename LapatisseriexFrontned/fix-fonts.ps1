# Font Style Cleanup Script
# This script removes inline fontFamily styles and replaces them with Tailwind classes

$srcPath = ".\src"

Write-Host "Starting font style cleanup..." -ForegroundColor Green

# Pattern 1: Remove fontFamily from style objects and add font-sans class
$files = Get-ChildItem -Path $srcPath -Recurse -Include *.jsx,*.js

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $replacements = 0
    
    # Simple pattern: Remove common fontFamily declarations
    $content = $content -replace "fontFamily:\s*'system-ui,\s*-apple-system,\s*sans-serif'", ""
    $content = $content -replace 'fontFamily:\s*"system-ui,\s*-apple-system,\s*sans-serif"', ""
    $content = $content -replace "fontFamily:\s*'system-ui,\s*-apple-system,\s*""Segoe UI"",\s*Roboto,\s*""Helvetica Neue"",\s*Arial,\s*sans-serif'", ""
    $content = $content -replace 'fontFamily:\s*"system-ui,\s*-apple-system,\s*""Segoe UI"",\s*Roboto,\s*""Helvetica Neue"",\s*Arial,\s*sans-serif"', ""
    
    # Remove trailing commas and spaces
    $content = $content -replace ",\s*\}", "}"
    $content = $content -replace "\{\s*,", "{"
    $content = $content -replace ",\s*,", ","
    
    # Remove empty style objects
    $content = $content -replace '\s*style=\{\{\}\}', ""
    
    # Remove redundant fontWeight: 400
    $content = $content -replace ",?\s*fontWeight:\s*400\s*,?", ""
    
    # Count changes
    if ($content -ne $originalContent) {
        $replacements = ($originalContent.Length - $content.Length)
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalFiles++
        $totalReplacements += $replacements
        $fileName = $file.Name
        Write-Host "  Updated: $fileName - $replacements chars removed" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host "Files modified: $totalFiles" -ForegroundColor Cyan
Write-Host "Approximate characters removed: $totalReplacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: You may need to manually add 'font-sans' class to some elements." -ForegroundColor Gray
