$files = Get-ChildItem -Path ".\calculators" -Recurse -Filter "index.html" | Where-Object { $_.FullName -match "\\calculators\\[^\\]+\\[^\\]+\\index\.html$" }

$items = foreach ($f in $files) {
  $html = Get-Content $f.FullName -Raw

  $title = ""
  if ($html -match "<title>\s*(.*?)\s*\|\s*SnapCalc\s*</title>") { $title = $matches[1].Trim() }

  $url = ""
  if ($html -match '<link\s+rel="canonical"\s+href="https://snapcalc\.site([^"]+)"\s*/?>') { $url = $matches[1].Trim() }

  $category = ""
  if ($html -match '<nav class="breadcrumbs">[\s\S]*?<a href="/categories/[^"]+/">\s*([^<]+)\s*</a>') { $category = $matches[1].Trim() }

  $base = $title.ToLower()

  $aliases = @(
    $base,
    ($base -replace " calculator$",""),
    ($base + " calculator"),
    ($base -replace " and "," "),
    ($base -replace "[^a-z0-9\s]+"," " -replace "\s+"," ").Trim(),
    (($base -split "\s+" | Select-Object -First 2) -join " "),
    (($base -split "\s+" | Select-Object -First 3) -join " "),
    ($base -replace "\s+","-"),
    ($base -replace "\s+",""),
    (($base -split "\s+" | ForEach-Object { $_[0] }) -join "")
  ) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" } | Select-Object -Unique

  while ($aliases.Count -lt 10) { $aliases += $aliases[-1] }
  if ($aliases.Count -gt 10) { $aliases = $aliases[0..9] }

  if ($title -and $url -and $category) {
    [pscustomobject]@{
      title = $title
      url = $url
      category = ($category -replace "&amp;","&")
      aliases = $aliases
    }
  }
}

$items = $items | Sort-Object url
$items | ConvertTo-Json -Depth 5 | Out-File -Encoding UTF8 ".\search-index.generated.json"
Write-Host ("Generated entries: " + $items.Count)
Write-Host "Wrote: search-index.generated.json"
