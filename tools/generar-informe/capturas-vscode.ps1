# Captura VS Code REAL: abre el repositorio en una ventana con perfil temporal (no toca tu configuración), va a cada
# fragmento de lib/codigos.js y guarda la ventana como PNG en docs/evidencias/informe/codigo-vscode/.
# Uso: node lista-vscode.mjs <lista.json>; luego powershell -File capturas-vscode.ps1 -Lista <lista.json> [-Solo clave]
param([string]$Lista, [string]$Solo = '')

$ErrorActionPreference = 'Stop'
$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$salida = Join-Path $raiz 'docs\evidencias\informe\codigo-vscode'
New-Item -ItemType Directory -Force $salida | Out-Null
$perfil = Join-Path $env:TEMP 'vscode-capturas-reservaupla'
# Perfil y extensiones SIEMPRE nuevos: así el estado de la barra lateral es predecible y no se cargan extensiones tuyas.
Get-CimInstance Win32_Process -Filter "Name='Code.exe'" | Where-Object { $_.CommandLine -like '*vscode-capturas-reservaupla*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
Remove-Item -Recurse -Force $perfil -ErrorAction SilentlyContinue
$extensiones = Join-Path $perfil 'extensiones'
New-Item -ItemType Directory -Force $extensiones | Out-Null
New-Item -ItemType Directory -Force "$perfil\User" | Out-Null

# Ajustes del perfil temporal: tema oscuro por defecto, sin minimapa, ajuste de línea y letra grande para que se lea en Word.
@'
{
  "workbench.startupEditor": "none",
  "workbench.colorTheme": "Default Dark Modern",
  "editor.minimap.enabled": false,
  "editor.fontSize": 14,
  "editor.lineHeight": 21,
  "editor.wordWrap": "on",
  "editor.renderWhitespace": "none",
  "editor.guides.indentation": true,
  "editor.scrollBeyondLastLine": false,
  "editor.occurrencesHighlight": "off",
  "editor.selectionHighlight": false,
  "editor.cursorBlinking": "solid",
  "editor.stickyScroll.enabled": false,
  "security.workspace.trust.enabled": false,
  "telemetry.telemetryLevel": "off",
  "update.mode": "none",
  "extensions.autoUpdate": false,
  "workbench.tips.enabled": false,
  "workbench.welcomePage.walkthroughs.openOnInstall": false,
  "window.restoreWindows": "none",
  "window.titleBarStyle": "custom",
  "git.enabled": false,
  "extensions.ignoreRecommendations": true,
  "extensions.showRecommendationsOnlyOnDemand": true,
  "workbench.enableExperiments": false,
  "chat.disableAIFeatures": true,
  "workbench.secondarySideBar.defaultVisibility": "hidden",
  "workbench.layoutControl.enabled": false,
  "window.commandCenter": false,
  "workbench.editor.showTabCloseButton": false,
  "problems.decorations.enabled": false
}
'@ | Set-Content -Encoding UTF8 "$perfil\User\settings.json"

Add-Type -ReferencedAssemblies System.Drawing @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public class Cap {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int hh, bool repaint);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  public static void Guardar(IntPtr h, string ruta) {
    RECT r; GetWindowRect(h, out r);
    int w = r.R - r.L, hh = r.B - r.T;
    using (var bmp = new Bitmap(w, hh)) {
      using (var g = Graphics.FromImage(bmp)) { IntPtr dc = g.GetHdc(); PrintWindow(h, dc, 2); g.ReleaseHdc(dc); }
      bmp.Save(ruta, ImageFormat.Png);
    }
  }
}
'@
[Cap]::SetProcessDPIAware() | Out-Null

$code = Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\bin\code.cmd'
$elementos = Get-Content $Lista -Raw | ConvertFrom-Json
if ($Solo) { $elementos = $elementos | Where-Object { $_.clave -eq $Solo } }
$comunes = @('--user-data-dir', $perfil, '--extensions-dir', $extensiones)

function Ventana {
  # Solo la ventana de ESTE perfil temporal (nunca tu VS Code): el proceso principal lleva --user-data-dir y no lleva --type.
  $ids = Get-CimInstance Win32_Process -Filter "Name='Code.exe'" | Where-Object { $_.CommandLine -like '*vscode-capturas-reservaupla*' -and $_.CommandLine -notlike '*--type=*' } | ForEach-Object { $_.ProcessId }
  Get-Process Code -ErrorAction SilentlyContinue | Where-Object { $ids -contains $_.Id -and $_.MainWindowHandle -ne 0 } | Select-Object -First 1
}

$primera = $true
foreach ($e in $elementos) {
  $destino = "$($e.ruta):$($e.medio)"
  if ($primera) { & $code @comunes -n $raiz -g $destino } else { & $code @comunes -r -g $destino }
  $ventana = $null
  for ($i = 0; $i -lt 40 -and -not $ventana; $i++) { Start-Sleep -Milliseconds 500; $ventana = Ventana }
  if (-not $ventana) { throw 'No apareció la ventana de VS Code' }
  [Cap]::ShowWindow($ventana.MainWindowHandle, 9) | Out-Null
  [Cap]::MoveWindow($ventana.MainWindowHandle, 40, 20, 1100, 1000, $true) | Out-Null
  if ($primera) {
    # Una sola vez: cerrar la barra lateral (Ctrl+B) para que el código ocupe todo el ancho.
    [Cap]::SetForegroundWindow($ventana.MainWindowHandle) | Out-Null
    Start-Sleep -Milliseconds 2500
    $sh = New-Object -ComObject WScript.Shell
    $sh.SendKeys('%')
    [void]$sh.AppActivate($ventana.Id)
    Start-Sleep -Milliseconds 800
    [Cap]::SetForegroundWindow($ventana.MainWindowHandle) | Out-Null
    $sh.SendKeys('^b')
    $primera = $false
  }
  Start-Sleep -Milliseconds 2500
  [Cap]::Guardar($ventana.MainWindowHandle, (Join-Path $salida "$($e.clave).png"))
  Write-Output "ok $($e.clave)  $($ventana.MainWindowTitle)"
}

# Cierra solo la ventana de este perfil temporal.
Get-CimInstance Win32_Process -Filter "Name='Code.exe'" | Where-Object { $_.CommandLine -like "*vscode-capturas-reservaupla*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
