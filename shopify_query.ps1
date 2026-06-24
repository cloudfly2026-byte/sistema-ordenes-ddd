# Script para consultar la API de Shopify
# Requiere: Shopify Admin Access Token

$shopDomain = "vbgfkr-d0.myshopify.com"
$apiVersion = "2026-04"

# El SHOPIFY_CLIENT_SECRET NO es el Admin Access Token
# El Admin Access Token se obtiene desde el Admin de Shopify:
# 1. Ir a Settings > Apps and sales channels
# 2. Click "Develop apps" > Seleccionar tu app
# 3. Click "Configure" en Admin API scopes
# 4. Seleccionar permisos (read_orders, read_products, read_inventory, etc.)
# 5. Click "Install app" o "Reinstall app"
# 6. Copiar el Admin Access Token que se genera

$clientSecret = $env:SHOPIFY_WEBHOOK_SECRET

Write-Host "=========================================="
Write-Host "  CONSULTA API SHOPIFY"
Write-Host "  Tienda: $shopDomain"
Write-Host "=========================================="
Write-Host ""

# Intentar con el client secret como token (probablemente fallará)
$headers = @{
    "X-Shopify-Access-Token" = $clientSecret
    "Content-Type" = "application/json"
}

Write-Host "=== INTENTANDO CON CLIENT SECRET ==="
Write-Host "(Probablemente falle - se necesita Admin Access Token)"
Write-Host ""

try {
    $orders = Invoke-RestMethod -Uri "https://$shopDomain/admin/api/$apiVersion/orders.json?limit=10&status=any" -Headers $headers -Method Get -TimeoutSec 15
    Write-Host "EXITO! Ordenes encontradas: $($orders.orders.Count)"
    $orders.orders | ForEach-Object {
        Write-Host "  Orden #$($_.order_number) | ID: $($_.id) | Estado: $($_.financial_status) | Total: $($_.total_price) $($_.currency)"
        Write-Host "  Email: $($_.email)"
        $_.line_items | ForEach-Object {
            Write-Host "    - $($_.title) x$($_.quantity) | SKU: $($_.sku) | $($_.price)"
        }
        Write-Host ""
    }
} catch {
    Write-Host "Error (esperado): $($_.Exception.Message)"
    Write-Host ""
    Write-Host "=== COMO OBTENER EL ADMIN ACCESS TOKEN ==="
    Write-Host "1. Inicia sesion en tu tienda Shopify: https://$shopDomain/admin"
    Write-Host "2. Ve a: Settings > Apps and sales channels"
    Write-Host "3. Click 'Develop apps' en la seccion de abajo"
    Write-Host "4. Selecciona tu app (o crea una nueva)"
    Write-Host "5. En 'Admin API access token', click 'Reveal token once'"
    Write-Host "   O si no existe, ve a 'Configure Admin API scopes',"
    Write-Host "   selecciona los permisos necesarios y guarda."
    Write-Host "6. Copia el token y reemplaza en este script"
    Write-Host ""
    Write-Host "Alternativamente, si usas OAuth:"
    Write-Host "  GET https://$shopDomain/admin/oauth/authorize"
    Write-Host "    ?client_id=<API_KEY>"
    Write-Host "    &scope=read_orders,read_products,read_inventory"
    Write-Host "    &redirect_uri=<tu_callback_url>"
    Write-Host "    &state=<nonce>"
    Write-Host ""
    Write-Host "Luego intercambia el code por un token:"
    Write-Host "  POST https://$shopDomain/admin/oauth/access_token"
    Write-Host "    Body: { client_id, client_secret, code }"
}

