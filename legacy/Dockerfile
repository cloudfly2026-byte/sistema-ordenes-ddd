# ─────────────────────────────────────────────────────────────────────────
# Dockerfile: Legacy PHP Service — Materiales bajo stock
# ─────────────────────────────────────────────────────────────────────────
#
# Base: php:8.2-apache con PDO PostgreSQL
# Puerto expuesto: 8080
#
# Variables de entorno (con valores por defecto para desarrollo):
#   DB_HOST     — Host de PostgreSQL  (default: localhost)
#   DB_PORT     — Puerto              (default: 5432)
#   DB_NAME     — Nombre de la BD     (default: shopify_packing)
#   DB_USER     — Usuario             (default: postgres)
#   DB_PASSWORD — Contraseña          (default: postgres)
#   DB_SSLMODE  — Modo SSL            (default: prefer)
#   APP_ENV     — Entorno             (default: production)
#
# Uso:
#   docker build -t legacy-materiales .
#   docker run -p 8080:8080 \
#     -e DB_HOST=postgres \
#     -e DB_PORT=5432 \
#     -e DB_NAME=shopify_packing \
#     -e DB_USER=postgres \
#     -e DB_PASSWORD=secret \
#     legacy-materiales
# ─────────────────────────────────────────────────────────────────────────

FROM php:8.2-apache

LABEL maintainer="OWL — ZOO Company"
LABEL description="Legacy PHP service — Materiales bajo stock (PDO PostgreSQL)"

# ── Instalar dependencias del sistema y extensión pdo_pgsql ──
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql \
    && apt-get purge -y --remove libpq-dev \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# ── Habilitar mod_rewrite de Apache (buena práctica) ──
RUN a2enmod rewrite headers

# ── Configurar Apache para escuchar en puerto 8080 ──
RUN sed -i 's/80/8080/g' /etc/apache2/ports.conf \
    && sed -i 's/:80/:8080/g' /etc/apache2/sites-available/000-default.conf

# ── Configurar DocumentRoot ──
ENV APACHE_DOCUMENT_ROOT=/var/www/html
RUN sed -i 's|/var/www/html|/var/www/html|g' /etc/apache2/sites-available/000-default.conf

# ── Configurar php.ini para producción ──
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" 2>/dev/null || true

# ── Variables de entorno por defecto (override en runtime) ──
ENV DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=shopify_packing \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_SSLMODE=prefer \
    APP_ENV=production

# ── Copiar código fuente ──
WORKDIR /var/www/html
COPY . /var/www/html/

# ── Permisos ──
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# ── Exponer puerto ──
EXPOSE 8080

# ── Health check ──
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health.php || exit 1

# ── Comando por defecto ──
CMD ["apache2-foreground"]
