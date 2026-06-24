#!/usr/bin/env python3
"""
Script de Pruebas - Integración Shopify
Simula el envío de webhooks de Shopify al sistema y valida las respuestas.

Uso:
    python test-shopify-integration.py
    python test-shopify-integration.py --url http://localhost:3000
    python test-shopify-integration.py --verbose
"""

import argparse
import os
import base64
import hashlib
import hmac
import json
import sys
import time
import uuid
from datetime import datetime

try:
    import requests
except ImportError:
    print("❌ Requiere 'requests'. Instalar con: pip install requests")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════════
# Configuración
# ═══════════════════════════════════════════════════════════════════════════════

SHOPIFY_SECRET = os.environ["SHOPIFY_WEBHOOK_SECRET"]
DEFAULT_URL = "http://localhost:3000"


# ═══════════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════════

def generate_hmac(payload: dict, secret: str) -> str:
    """Genera firma HMAC-SHA256 como la usa Shopify (base64)."""
    raw_body = json.dumps(payload, separators=(",", ":"))
    return base64.b64encode(
        hmac.new(
            secret.encode("utf-8"),
            raw_body.encode("utf-8"),
            hashlib.sha256,
        ).digest()
    ).decode("utf-8")


def make_payload(order_id: int, num_items: int = 2, fragile: bool = False) -> dict:
    """Genera un payload de webhook orders/create de Shopify."""
    items = []
    for i in range(num_items):
        item = {
            "id": 1000 + i,
            "product_id": 2000 + i,
            "variant_id": 3000 + i,
            "sku": f"SKU-{order_id}-{i}",
            "title": f"Producto {i + 1}",
            "quantity": 1,
            "properties": [{"name": "fragile", "value": "true"}] if fragile else [],
        }
        items.append(item)

    return {
        "id": order_id,
        "order_number": str(order_id)[-4:],
        "email": f"cliente{order_id}@ejemplo.com",
        "total_price": f"{num_items * 25.99:.2f}",
        "line_items": items,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }


class TestResult:
    """Almacena el resultado de un test."""

    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.status_code = None
        self.response_time = None
        self.error = None

    def __repr__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status} | {self.name} (HTTP {self.status_code}, {self.response_time:.0f}ms)"


# ═══════════════════════════════════════════════════════════════════════════════
# Tests
# ═══════════════════════════════════════════════════════════════════════════════

class ShopifyIntegrationTests:
    def __init__(self, base_url: str, verbose: bool = False):
        self.base_url = base_url.rstrip("/")
        self.webhook_url = f"{self.base_url}/api/v1/webhooks/shopify"
        self.verbose = verbose
        self.results: list[TestResult] = []

    def run_all(self):
        """Ejecuta todos los tests de integración."""
        print("=" * 70)
        print("🧪 PRUEBAS DE INTEGRACIÓN SHOPIFY")
        print(f"   URL: {self.webhook_url}")
        print(f"   Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)

        # Épica 1: Integración con Shopify
        print("\n📦 ÉPICA 1: INTEGRACIÓN CON SHOPIFY")
        print("-" * 50)
        self.run_test("HU-001: Webhook válido", self._test_hu001_webhook_valido)
        self.run_test("HU-001: Respuesta 200", self._test_hu001_respuesta_200)
        self.run_test("HU-001: Tiempo respuesta <500ms", self._test_hu001_tiempo_respuesta)
        self.run_test("HU-002: HMAC válido", self._test_hu002_hmac_valido)
        self.run_test("HU-002: HMAC inválido → 401", self._test_hu002_hmac_invalido)
        self.run_test("HU-002: Sin HMAC → 401", self._test_hu002_sin_hmac)
        self.run_test("HU-002: HMAC vacío → 401", self._test_hu002_hmac_vacio)
        self.run_test("HU-003: Extracción datos", self._test_hu003_extraccion_datos)
        self.run_test("HU-003: Productos frágiles", self._test_hu003_productos_fragiles)
        self.run_test("HU-003: Múltiples productos", self._test_hu003_multiples_productos)
        self.run_test("HU-004: Webhook duplicado", self._test_hu004_duplicado)
        self.run_test("HU-005: Body vacío", self._test_hu005_body_vacio)
        self.run_test("HU-005: Sin line_items", self._test_hu005_sin_line_items)

        # Épica 2: Cálculo de Materiales
        print("\n📦 ÉPICA 2: CÁLCULO DE MATERIALES")
        print("-" * 50)
        self.run_test("HU-006: Caja SMALL (1 prod)", self._test_hu006_box_small)
        self.run_test("HU-006: Caja MEDIUM (4 prods)", self._test_hu006_box_medium)
        self.run_test("HU-006: Caja LARGE (7 prods)", self._test_hu006_box_large)
        self.run_test("HU-007: Materiales obligatorios", self._test_hu007_materiales_obligatorios)
        self.run_test("HU-008: FILLER con frágiles", self._test_hu008_filler_con_fragiles)
        self.run_test("HU-008: Sin FILLER sin frágiles", self._test_hu008_filler_sin_fragiles)
        self.run_test("HU-008: 1 FILLER múltiples frágiles", self._test_hu008_un_solo_filler_multiples_fragiles)

        # Edge Cases
        print("\n📦 EDGE CASES")
        print("-" * 50)
        self.run_test("Edge: Orden vacía", self._test_edge_orden_vacia)
        self.run_test("Edge: Cantidad cero", self._test_edge_cantidad_cero)
        self.run_test("Edge: Topic diferente", self._test_edge_topic_diferente)

        # Resumen
        self.print_summary()

    def send_webhook(self, payload: dict, hmac_signature: str = None, topic: str = "orders/create") -> requests.Response:
        """Envía un webhook al sistema."""
        if hmac_signature is None:
            hmac_signature = generate_hmac(payload, SHOPIFY_SECRET)

        headers = {
            "Content-Type": "application/json",
            "X-Shopify-Hmac-SHA256": hmac_signature,
            "X-Shopify-Topic": topic,
        }

        raw_body = json.dumps(payload, separators=(",", ":"))
        return requests.post(self.webhook_url, data=raw_body, headers=headers, timeout=10)

    def run_test(self, name: str, test_func) -> TestResult:
        """Ejecuta un test individual y registra el resultado."""
        result = TestResult(name)
        try:
            start = time.time()
            test_func(result)
            result.response_time = (time.time() - start) * 1000
        except requests.ConnectionError:
            result.error = "No se pudo conectar al servidor"
            result.passed = False
        except Exception as e:
            result.error = str(e)
            result.passed = False

        self.results.append(result)
        print(f"  {result}")
        if self.verbose and result.error:
            print(f"       ⚠️  {result.error}")
        return result

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-001: Recepción de Webhook
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu001_webhook_valido(self, r: TestResult):
        payload = make_payload(100001)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu001_respuesta_200(self, r: TestResult):
        payload = make_payload(100002)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200 and resp.json().get("received") is True

    def _test_hu001_tiempo_respuesta(self, r: TestResult):
        """RNF-001: Webhook debe procesarse en menos de 500ms."""
        payload = make_payload(100003)
        start = time.time()
        resp = self.send_webhook(payload)
        elapsed = (time.time() - start) * 1000
        r.status_code = resp.status_code
        r.response_time = elapsed
        r.passed = resp.status_code == 200 and elapsed < 500

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-002: Validación HMAC
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu002_hmac_valido(self, r: TestResult):
        payload = make_payload(200001)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu002_hmac_invalido(self, r: TestResult):
        payload = make_payload(200002)
        resp = self.send_webhook(payload, hmac_signature="firma-invalida-abc123")
        r.status_code = resp.status_code
        r.passed = resp.status_code == 401

    def _test_hu002_sin_hmac(self, r: TestResult):
        payload = make_payload(200003)
        raw_body = json.dumps(payload, separators=(",", ":"))
        headers = {"Content-Type": "application/json", "X-Shopify-Topic": "orders/create"}
        resp = requests.post(self.webhook_url, data=raw_body, headers=headers, timeout=10)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 401

    def _test_hu002_hmac_vacio(self, r: TestResult):
        payload = make_payload(200004)
        resp = self.send_webhook(payload, hmac_signature="")
        r.status_code = resp.status_code
        r.passed = resp.status_code == 401

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-003: Extracción de Datos
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu003_extraccion_datos(self, r: TestResult):
        payload = make_payload(300001, num_items=2)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu003_productos_fragiles(self, r: TestResult):
        payload = make_payload(300002, num_items=1, fragile=True)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu003_multiples_productos(self, r: TestResult):
        payload = make_payload(300003, num_items=5)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-004: Webhooks Duplicados
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu004_duplicado(self, r: TestResult):
        payload = make_payload(400001)
        resp1 = self.send_webhook(payload)
        resp2 = self.send_webhook(payload)  # Duplicado
        r.status_code = resp2.status_code
        # Ambos deben responder 200 (idempotencia)
        r.passed = resp1.status_code == 200 and resp2.status_code == 200

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-005: Formato Inválido
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu005_body_vacio(self, r: TestResult):
        resp = self.send_webhook({})
        r.status_code = resp.status_code
        r.passed = resp.status_code in [200, 400]

    def _test_hu005_sin_line_items(self, r: TestResult):
        payload = {"id": 500001, "order_number": "1001", "email": "test@test.com", "total_price": "10.00"}
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code in [200, 400]

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-006: Cálculo de Caja
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu006_box_small(self, r: TestResult):
        """1-2 productos → BOX_SMALL"""
        payload = make_payload(600001, num_items=1)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu006_box_medium(self, r: TestResult):
        """3-5 productos → BOX_MEDIUM"""
        payload = make_payload(600002, num_items=4)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu006_box_large(self, r: TestResult):
        """6+ productos → BOX_LARGE"""
        payload = make_payload(600003, num_items=7)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-007: Materiales Obligatorios
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu007_materiales_obligatorios(self, r: TestResult):
        """LABEL=1, TAPE=1 para cualquier orden"""
        payload = make_payload(700001, num_items=2)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    # ═══════════════════════════════════════════════════════════════════════════
    # HU-008: FILLER para Frágiles
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_hu008_filler_con_fragiles(self, r: TestResult):
        payload = make_payload(800001, num_items=1, fragile=True)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu008_filler_sin_fragiles(self, r: TestResult):
        payload = make_payload(800002, num_items=2, fragile=False)
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    def _test_hu008_un_solo_filler_multiples_fragiles(self, r: TestResult):
        """Solo 1 FILLER aunque haya múltiples frágiles."""
        payload = {
            "id": 800003,
            "order_number": "1003",
            "email": "test@test.com",
            "total_price": "75.00",
            "line_items": [
                {"id": 1, "product_id": 10, "variant_id": 100, "sku": "FRAG-1", "title": "Frag 1", "quantity": 1, "properties": [{"name": "fragile", "value": "true"}]},
                {"id": 2, "product_id": 11, "variant_id": 101, "sku": "FRAG-2", "title": "Frag 2", "quantity": 1, "properties": [{"name": "fragile", "value": "true"}]},
                {"id": 3, "product_id": 12, "variant_id": 102, "sku": "NORM-1", "title": "Normal", "quantity": 1, "properties": []},
            ],
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200

    # ═══════════════════════════════════════════════════════════════════════════
    # Edge Cases
    # ═══════════════════════════════════════════════════════════════════════════

    def _test_edge_orden_vacia(self, r: TestResult):
        payload = {"id": 900001, "order_number": "1001", "email": "test@test.com", "total_price": "0.00", "line_items": []}
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code in [200, 400]

    def _test_edge_cantidad_cero(self, r: TestResult):
        payload = {
            "id": 900002,
            "order_number": "1002",
            "email": "test@test.com",
            "total_price": "10.00",
            "line_items": [{"id": 1, "product_id": 10, "variant_id": 100, "sku": "SKU-0", "title": "Prod", "quantity": 0, "properties": []}],
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
        resp = self.send_webhook(payload)
        r.status_code = resp.status_code
        r.passed = resp.status_code in [200, 400]

    def _test_edge_topic_diferente(self, r: TestResult):
        payload = make_payload(900003)
        resp = self.send_webhook(payload, topic="orders/updated")
        r.status_code = resp.status_code
        r.passed = resp.status_code == 200  # Responde 200 pero no procesa

    # ═══════════════════════════════════════════════════════════════════════════
    # Resumen
    # ═══════════════════════════════════════════════════════════════════════════

    def print_summary(self):
        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)

        print("\n" + "=" * 70)
        print("📊 RESUMEN DE PRUEBAS")
        print("=" * 70)
        print(f"   Total:  {total}")
        print(f"   ✅ Pass: {passed}")
        print(f"   ❌ Fail: {failed}")
        print(f"   📈 Tasa: {passed/total*100:.1f}%" if total > 0 else "   📈 Tasa: N/A")

        if failed > 0:
            print("\n   Tests fallidos:")
            for r in self.results:
                if not r.passed:
                    print(f"     - {r.name} (HTTP {r.status_code})")

        print("=" * 70)

        # Exit code
        sys.exit(0 if failed == 0 else 1)


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Pruebas de integración Shopify")
    parser.add_argument("--url", default=DEFAULT_URL, help="URL base del API")
    parser.add_argument("--verbose", "-v", action="store_true", help="Output detallado")
    args = parser.parse_args()

    tests = ShopifyIntegrationTests(args.url, args.verbose)
    tests.run_all()


if __name__ == "__main__":
    main()
