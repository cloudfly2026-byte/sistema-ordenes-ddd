# Servidor local temporal para capturar el callback OAuth de Shopify
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8082/callback/")
$listener.Start()

Write-Host "=========================================="
Write-Host "  SERVIDOR OAUTH CALLBACK ACTIVO"
Write-Host "  Escuchando en: http://localhost:8082/callback/"
Write-Host "=========================================="
Write-Host ""
Write-Host "Esperando callback de Shopify..."
Write-Host ""

$server = $true
while ($server) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $query = $request.Url.Query
    Write-Host "=== CALLBACK RECIBIDO ==="
    Write-Host "URL: $($request.Url)"
    Write-Host "Query: $query"
    Write-Host ""

    # Extraer el code
    $code = ($query -split '&' | Where-Object { $_ -match '^code=' }) -replace 'code=', ''
    $shop = ($query -split '&' | Where-Object { $_ -match '^shop=' }) -replace 'shop=', ''
    $state = ($query -split '&' | Where-Object { $_ -match '^state=' }) -replace 'state=', ''

    Write-Host "CODE: $code"
    Write-Host "SHOP: $shop"
    Write-Host "STATE: $state"
    Write-Host ""

    # Guardar el code en un archivo para que el script principal lo lea
    if ($code) {
        $code | Out-File -FilePath "$PSScriptRoot\shopify_code.txt" -Encoding utf8 -Force
        Write-Host "Code guardado en shopify_code.txt"
    }

    # Responder al navegador
    $html = @"
<!DOCTYPE html>
<html>
<head><title>Shopify OAuth - Autorizado</title></head>
<body style="font-family: Arial; text-align: center; padding: 50px;">
    <h1>✅ Autorización exitosa!</h1>
    <p>Code: <code>$code</code></p>
    <p>Puedes cerrar esta ventana y pegar el code en el terminal.</p>
</body>
</html>
"@
    $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
    $response.ContentLength64 = $buffer.Length
    $response.ContentType = "text/html"
    $response.OutputStream.Write($buffer, 0, $buffer.Length)
    $response.OutputStream.Close()

    $server = $false
}

$listener.Stop()
Write-Host "Servidor cerrado."

