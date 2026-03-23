$rootPath = "C:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\frontend"

$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx","*.ts","*.jsx","*.js","*.css" |
  Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" -and $_.FullName -notlike "*\out\*" }

$replacements = @(
  # Replace RGBA gold with RGBA lime
  @{ P = "rgba(189,138,59";   R = "rgba(195,216,9"  },
  @{ P = "rgba(189, 138, 59";   R = "rgba(195, 216, 9"  },
  
  # Replace HEX gold with HEX lime
  @{ P = "#BD8A3B"; R = "#C3D809" },
  @{ P = "#bd8a3b"; R = "#c3d809" },
  @{ P = "#8B6E2A"; R = "#7A8A00" }, # Darker gold -> Darker lime
  @{ P = "#C4963A"; R = "#C3D809" },
  
  # Replace CSS Variables
  @{ P = "var(--gold)"; R = "var(--color-accent)" },
  @{ P = "var(--gold-light)"; R = "var(--color-accent)" },
  @{ P = "var(--gold-dark)"; R = "var(--color-accent)" },
  @{ P = "var(--white)"; R = "var(--bg-dark)" }
)

$count = 0
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
    $count++
    Write-Host "Updated: $($file.Name)"
  }
}
Write-Host "===== Done! Updated $count files ======"
