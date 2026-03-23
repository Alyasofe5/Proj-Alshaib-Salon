$rootPath = "C:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\frontend"

$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx","*.ts","*.jsx","*.js","*.css" |
  Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" }

$replacements = @(
  @{ P = "accent-gold";      R = "accent-lime" },
  @{ P = "text-cream";       R = "text-white" },
  @{ P = "#b8973f";          R = "#A8BB06" },
  @{ P = "#BD8A3B";          R = "#C3D809" },
  @{ P = "#FCFAF1";          R = "#F5F5F5" },
  @{ P = "#4A4535";          R = "#3A3830" },
  @{ P = "#101115";          R = "#222022" },
  @{ P = "#1C1D21";          R = "#2A282A" },
  @{ P = "#25262B";          R = "#302E30" }
)

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  if ($null -eq $content) { continue }
  $changed = $false
  foreach ($r in $replacements) {
    if ($content.Contains($r.P)) {
      $content = $content.Replace($r.P, $r.R)
      $changed = $true
    }
  }
  if ($changed) {
    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
    Write-Host "Updated: $($file.Name)"
  }
}
Write-Host "===== Rebrand complete! ======"
