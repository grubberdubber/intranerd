# ============================================================================
# IntraNerd · Atajos de desarrollo y despliegue
# ============================================================================
SHELL := /bin/bash
COMPOSE := docker compose
NODE := node
NPM := npm

.DEFAULT_GOAL := help
.PHONY: help install dev dev-api build lint format test test-unit test-integration test-e2e \
        db-migrate db-seed db-reset up down logs ps restart clean backup shell-api health

help: ## Muestra los comandos disponibles
	@awk 'BEGIN {FS = ":.*##"; printf "\nIntraNerd\n\n"} /^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Instala dependencias de raíz y backend
	$(NPM) install
	$(NPM) --prefix backend install

dev: ## SPA en :5173 con proxy /api al backend local
	$(NODE) frontend/scripts/dev.mjs

dev-api: ## API con recarga en caliente (:4000)
	$(NPM) --prefix backend run dev

build: ## Compila la SPA en dist/
	$(NPM) run build

lint: ## Verifica formato y guardrails
	$(NPM) run lint

format: ## Formatea el repositorio con Prettier
	$(NPM) run format

test: ## Suite completa (Vitest + cobertura)
	$(NPM) test

test-unit: ## Solo pruebas unitarias
	$(NPM) run test:unit

test-integration: ## Solo integración de la API (SQLite temporal)
	$(NPM) run test:integration

test-e2e: ## Pruebas E2E con Playwright
	$(NPM) run test:e2e

db-migrate: ## Aplica el esquema SQLite
	$(NPM) --prefix backend run db:migrate

db-seed: ## Carga datos demo
	$(NPM) --prefix backend run db:seed

db-reset: ## Recrea la base (solo desarrollo)
	$(NPM) --prefix backend run db:reset

up: ## Levanta el stack Docker completo
	$(COMPOSE) up -d --build

down: ## Detiene el stack conservando datos
	$(COMPOSE) down

logs: ## Sigue los logs del stack
	$(COMPOSE) logs -f

ps: ## Estado de los contenedores
	$(COMPOSE) ps

restart: ## Reinicia backend y frontend
	$(COMPOSE) restart backend frontend

clean: ## Elimina contenedores, red y volumen de datos
	$(COMPOSE) down -v --remove-orphans

backup: ## Copia la base SQLite en ./backups
	$(COMPOSE) --profile backup run --rm db-backup

shell-api: ## Abre una shell en el backend
	$(COMPOSE) exec backend sh

health: ## Consulta el healthcheck del stack
	@curl -fsS http://localhost:$${API_PORT:-4000}/api/v1/health | $(NODE) -e "process.stdin.pipe(process.stdout)"
	@echo
	@curl -fsS http://localhost:$${APP_PORT:-8080}/healthz
