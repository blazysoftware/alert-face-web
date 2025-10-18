# AI Face Detection - Development Commands
.PHONY: help build run stop clean logs health test

# Default target
help: ## Mostrar ajuda
	@echo "AI Face Detection - Comandos de Desenvolvimento"
	@echo ""
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Construir a imagem Docker
	@echo "🔨 Construindo imagem Docker..."
	docker build -t ai-face-detection:latest .
	@echo "✅ Imagem construída com sucesso!"

run: ## Executar container local
	@echo "🚀 Iniciando container local..."
	docker-compose up -d
	@echo "✅ Container iniciado em http://localhost:3000"

stop: ## Parar containers
	@echo "⏹️ Parando containers..."
	docker-compose down
	@echo "✅ Containers parados!"

restart: stop run ## Reiniciar containers

logs: ## Ver logs do container
	@echo "📋 Logs do container:"
	docker-compose logs -f ai-detection

health: ## Verificar status do container
	@echo "🔍 Verificando status..."
	@curl -s http://localhost:3000/health && echo " ✅ Aplicação saudável!" || echo " ❌ Aplicação com problemas!"
	@docker ps --filter "name=ai-face-detection" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

test: ## Testar build e funcionamento
	@echo "🧪 Testando build..."
	$(MAKE) build
	$(MAKE) run
	@sleep 10
	$(MAKE) health
	$(MAKE) stop
	@echo "✅ Teste concluído!"

clean: ## Limpar containers e imagens
	@echo "🧹 Limpando containers e imagens..."
	docker-compose down -v
	docker rmi ai-face-detection:latest || true
	docker system prune -f
	@echo "✅ Limpeza concluída!"

shell: ## Abrir shell no container
	@echo "🐚 Abrindo shell no container..."
	docker-compose exec ai-detection sh

nginx-test: ## Testar configuração do Nginx
	@echo "🔧 Testando configuração do Nginx..."
	docker run --rm -v $(PWD)/nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t
	@echo "✅ Configuração do Nginx válida!"

# Docker shortcuts
up: run
down: stop
ps: ## Mostrar containers em execução
	docker ps --filter "name=ai-face-detection"