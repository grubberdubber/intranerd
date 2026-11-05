# ============================================================================
# IntraNerd · Atajos de desarrollo y despliegue
# ============================================================================
SHELL := /bin/bash
COMPOSE := docker compose
NODE := node
PNPM := pnpm

.DEFAULT_GOAL := help
.PHONY: help install dev dev-api build lint format test test-unit test-integration test-backend test-e2e \
        db-migrate db-seed db-reset up down logs ps restart clean backup shell-api health

help: ## Muestra los comandos disponibles
	@awk 'BEGIN {FS = ":.*##"; printf "\nIntraNerd\n\n"} /^[a-zA-Z_-]+:.*?##/ {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Instala dependencias del workspace (raíz + backend)
	$(PNPM) install

dev: ## SPA en :5173 con proxy /api al backend local
	$(NODE) frontend/scripts/dev.mjs

dev-api: ## API con recarga en caliente (:4000)
	$(PNPM) --filter intranerd-backend dev

build: ## Compila la SPA en dist/
	$(PNPM) run build

lint: ## Verifica formato y guardrails
	$(PNPM) run lint

format: ## Formatea el repositorio con Prettier
	$(PNPM) run format

test: ## Suite completa (Vitest + cobertura)
	$(PNPM) test

test-unit: ## Solo pruebas unitarias
	$(PNPM) run test:unit

test-integration: ## Solo integración de la API (SQLite temporal)
	$(PNPM) run test:integration

test-backend: ## Suite HTTP del backend con node:test
	$(PNPM) run test:backend

test-e2e: ## Pruebas E2E con Playwright
	$(PNPM) run test:e2e

db-migrate: ## Aplica el esquema SQLite
	$(PNPM) --filter intranerd-backend db:migrate

db-seed: ## Carga datos demo
	$(PNPM) --filter intranerd-backend db:seed

db-reset: ## Recrea la base (solo desarrollo)
	$(PNPM) --filter intranerd-backend db:reset

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
