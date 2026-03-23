$rootPath = "C:\Users\WASEEM\Desktop\NA\Projects\Proj-Alshaib-Salon\frontend"

$files = Get-ChildItem -Path $rootPath -Recurse -Include "*.tsx","*.ts","*.jsx","*.js","*.css" |
  Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.next\*" -and $_.FullName -notlike "*\out\*" }

$replacements = @(
  @{ P = "rgba(255,255,255,0.08)";   R = "rgba(195,216,9,0.08)"  },
  @{ P = "rgba(255,255,255,.08)";    R = "rgba(195,216,9,.08)"   },
  @{ P = "rgba(255,255,255,0.05)";   R = "rgba(195,216,9,0.05)"  },
  @{ P = "rgba(255,255,255,.05)";    R = "rgba(195,216,9,.05)"   },
  @{ P = "rgba(255,255,255,0.06)";   R = "rgba(195,216,9,0.06)"  },
  @{ P = "rgba(255,255,255,.06)";    R = "rgba(195,216,9,.06)"   },
  @{ P = "rgba(255,255,255,0.1)";    R = "rgba(195,216,9,0.09)"  },
  @{ P = "rgba(255,255,255,.1)";     R = "rgba(195,216,9,.09)"   },
  @{ P = "rgba(255,255,255,0.12)";   R = "rgba(195,216,9,0.11)"  },
  @{ P = "rgba(255,255,255,.12)";    R = "rgba(195,216,9,.11)"   },
  @{ P = "rgba(255,255,255,0.15)";   R = "rgba(195,216,9,0.13)"  },
  @{ P = "rgba(255,255,255,.15)";    R = "rgba(195,216,9,.13)"   },
  @{ P = "rgba(255,255,255,0.2)";    R = "rgba(195,216,9,0.18)"  },
  @{ P = "rgba(255,255,255,.2)";     R = "rgba(195,216,9,.18)"   },
  @{ P = "rgba(255,255,255,0.25)";   R = "rgba(195,216,9,0.22)"  },
  @{ P = "rgba(255,255,255,.25)";    R = "rgba(195,216,9,.22)"   },
  @{ P = "rgba(255,255,255,0.3)";    R = "rgba(195,216,9,0.25)"  },
  @{ P = "rgba(255,255,255,.3)";     R = "rgba(195,216,9,.25)"   },
  @{ P = "rgba(255,255,255,0.8) inset"; R = "rgba(195,216,9,0.4) inset" },
  @{ P = "bg-white text-black";      R = "bg-accent-lime text-cta-dark" },
  @{ P = "hover:bg-white/90";        R = "hover:bg-[#D4EC0A]"    },
  @{ P = "hover:bg-white/20";        R = "hover:bg-[#C3D809]/15" },
  @{ P = "bg-white/10 text-white ";  R = "bg-[#C3D809]/10 text-[#C3D809] " },
  @{ P = "bg-white/10 text-gold";    R = "bg-[#C3D809]/10 text-[#C3D809]" },
  @{ P = "bg-white/30";              R = "bg-[#C3D809]/20"       },
  @{ P = "bg-white/20 -translate-x-full group-hover:translate-x-full"; R = "bg-[#C3D809]/15 -translate-x-full group-hover:translate-x-full" },
  @{ P = "bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%]"; R = "bg-[#C3D809]/15 translate-x-[-100%] group-hover:translate-x-[100%]" },
  @{ P = "hover:bg-white/[0.06]";    R = "hover:bg-[#C3D809]/[0.08]" },
  @{ P = "hover:bg-white/10";        R = "hover:bg-[#302E30]"    },
  @{ P = "hover:bg-white/5";         R = "hover:bg-[#302E30]"    },
  @{ P = "hover:bg-[#1A1A1A]";       R = "hover:bg-[#302E30]"    },
  @{ P = "bg-white/[.02]";           R = "bg-[#C3D809]/[.02]"   },
  @{ P = "border-white/[.04]";       R = "border-[#C3D809]/[.04]" },
  @{ P = "bg-white/5 text-[#F5F5F5]/30 hover:bg-white/10"; R = "bg-[#302E30] text-[#F5F5F5]/30 hover:bg-[#3A3830]" },
  @{ P = "bg-white/5 ";              R = "bg-[#302E30] "         },
  @{ P = "bg-white/5`"";             R = "bg-[#302E30]`""        },
  @{ P = 'bg-white/10 text-white border-white/20'; R = 'bg-[#C3D809]/10 text-[#C3D809] border-[#C3D809]/25' },
  @{ P = "bg-white/5 border-white/10 text-gray-300 hover:border-white/20 hover:text-white"; R = "bg-[#302E30] border-[#C3D809]/15 text-[#BBBBBB] hover:border-[#C3D809]/30 hover:text-[#F5F5F5]" },
  @{ P = "rgba(255,255,255,0.08), rgba(255,255,255,0.04)"; R = "rgba(195,216,9,0.08), rgba(195,216,9,0.04)" },
  @{ P = "linear-gradient(90deg, #666666, #DDDDDD)"; R = "linear-gradient(90deg, #7A8A00, #C3D809)" },
  @{ P = "rgba(45,45,45,.95)";       R = "rgba(34,32,34,.97)"   },
  @{ P = "rgba(45,45,45, 0.97)";     R = "rgba(34,32,34,0.97)"  },
  @{ P = 'const silverBg = "rgba(255,255,255,0.08)"'; R = 'const silverBg = "rgba(195,216,9,0.08)"' },
  @{ P = 'const silverBrd = "rgba(255,255,255,0.2)"'; R = 'const silverBrd = "rgba(195,216,9,0.22)"' },
  @{ P = "#2A2A2A";                  R = "#2A282A"               },
  @{ P = "bg-white text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(255,255,255,0.2)] hover:bg-[#F5F5F7]"; R = "font-black text-xs uppercase tracking-[0.2em] hover:opacity-90" }
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
