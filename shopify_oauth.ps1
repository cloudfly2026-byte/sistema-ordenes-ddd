# Script OAuth para obtener Admin Access Token de Shopify
# Abre la URL de autorización en tu navegador

$shopDomain = "vbgfkr-d0.myshopify.com"
$clientId = "e6c966c8c0d078db4626b0c1b7c245fe"
$clientSecret = $env:SHOPIFY_WEBHOOK_SECRET
$apiVersion = "2026-04"

# Scopes necesarios para consultar ordenes e inventario
$scopes = "read_orders,read_products,read_inventory,read_fulfillments"

# URL de autorización OAuth
$authUrl = "https://$shopDomain/admin/oauth/authorize?client_id=$clientId&scope=$scopes&redirect_uri=http://localhost:8082/callback&state=shopify_auth_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "=========================================="
Write-Host "  OAUTH SHOPIFY - Obtener Access Token"
Write-Host "  Tienda: $shopDomain"
Write-Host "=========================================="
Write-Host ""
Write-Host "PASO 1: Abre esta URL en tu navegador:"
Write-Host ""
Write-Host $authUrl
Write-Host ""
Write-Host "PASO 2: Autoriza la app en tu tienda Shopify"
Write-Host ""
Write-Host "PASO 3: Copia el 'code' de la URL de redireccion"
Write-Host "        (sera algo como: https://localhost/callback?code=ABC123&state=...)"
Write-Host ""
Write-Host "PASO 4: Ejecuta este script con el code:"
Write-Host "        .\shopify_oauth.ps1 -Code 'TU_CODE_AQUI'"
Write-Host ""

# Si se pasó un code como parametro, intercambiarlo por un token
param([string]$Code)

if ($Code) {
    Write-Host "=== INTERCAMBIANDO CODE POR ACCESS TOKEN ==="

    $body = @{
        client_id     = $clientId
        client_secret = $clientSecret
        code          = $Code
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "https://$shopDomain/admin/oauth/access_token" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15

        $accessToken = $response.access_token
        Write-Host ""
        Write-Host "=== ACCESS TOKEN OBTENIDO ==="
        Write-Host $accessToken
        Write-Host ""
        Write-Host "Guardalo en tu .env como:"
        Write-Host "SHOPIFY_ADMIN_ACCESS_TOKEN=$accessToken"
        Write-Host ""

        # Consultar ordenes
        Write-Host "=== CONSULTANDO ORDENES ==="
        $headers = @{
            "X-Shopify-Access-Token" = $accessToken
            "Content-Type" = "application/json"
        }

        $orders = Invoke-RestMethod -Uri "https://$shopDomain/admin/api/$apiVersion/orders.json?limit=10&status=any" -Headers $headers -Method Get -TimeoutSec 15
        Write-Host "Ordenes encontradas: $($orders.orders.Count)"
        $orders.orders | ForEach-Object {
            Write-Host "  Orden #$($_.order_number) | ID: $($_.id) | Estado: $($_.financial_status) | Total: $($_.total_price) $($_.currency)"
            Write-Host "  Email: $($_.email)"
            $_.line_items | ForEach-Object {
                Write-Host "    - $($_.title) x$($_.quantity) | SKU: $($_.sku) | $($_.price)"
            }
            Write-Host ""
        }

        # Consultar productos/inventario
        Write-Host "=== CONSULTANDO PRODUCTOS/INVENTARIO ==="
        $products = Invoke-RestMethod -Uri "https://$shopDomain/admin/api/$apiVersion/products.json?limit=10" -Headers $headers -Method Get -TimeoutSec 15
        Write-Host "Productos encontrados: $($products.products.Count)"
        $products.products | ForEach-Object {
            Write-Host "  Producto: $($_.title) | ID: $($_.id)"
            $_.variants | ForEach-Object {
                Write-Host "    Variante: $($_.title) | SKU: $($_.sku) | Inventario: $($_.inventory_quantity) | Precio: $($_.price)"
            }
        }

    } catch {
        Write-Host "Error: $($_.Exception.Message)"
    }
}
