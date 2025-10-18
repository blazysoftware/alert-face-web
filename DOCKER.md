# AI Face Detection - Docker Setup

Este projeto está configurado para deploy automático com **Coolify** usando Docker.

## 🐳 Configuração Docker

### Estrutura
- `Dockerfile` - Imagem baseada em Nginx Alpine
- `docker-compose.yml` - Configuração para desenvolvimento local
- `nginx.conf` - Configuração personalizada do Nginx
- `404.html` / `50x.html` - Páginas de erro personalizadas

### Características

#### 🚀 **Performance**
- Nginx Alpine (imagem leve ~5MB)
- Compressão Gzip habilitada
- Cache de arquivos estáticos
- Health check endpoint (`/health`)

#### 🔒 **Segurança**
- Headers de segurança configurados
- Tokens de servidor ocultados
- Proteção contra ataques XSS
- Content Security Policy

#### 📊 **Monitoramento**
- Health check automático
- Logs estruturados
- Métricas de acesso

## 🛠️ Desenvolvimento Local

### Pré-requisitos
```bash
docker --version
docker-compose --version
```

### Comandos Disponíveis
```bash
# Construir imagem
make build

# Executar localmente
make run
# Aplicação estará em http://localhost:3000

# Ver logs
make logs

# Parar containers
make stop

# Verificar saúde
make health

# Testar configuração nginx
make nginx-test

# Limpar tudo
make clean
```

### Desenvolvimento Rápido
```bash
# Tudo em um comando
make test
```

## ☁️ Deploy com Coolify

### Configuração no Coolify

1. **Repositório**: `https://github.com/blazysoftware/alert-face-web`
2. **Branch**: `main`
3. **Build Pack**: `Docker Compose`
4. **Port**: `3000` (interno), mapeado automaticamente pelo Coolify

### Variáveis de Ambiente
Nenhuma variável especial necessária - a aplicação é estática.

### Health Check
- **Endpoint**: `/health`
- **Intervalo**: 30s
- **Timeout**: 10s
- **Retries**: 3

### Volumes Persistentes
- `nginx-logs` - Logs do Nginx (opcional)

## 📁 Estrutura de Arquivos

```
.
├── Dockerfile              # Imagem Docker
├── docker-compose.yml      # Configuração local
├── nginx.conf             # Config personalizada Nginx
├── .dockerignore          # Arquivos ignorados no build
├── Makefile               # Comandos de desenvolvimento
├── index.html             # Aplicação principal
├── app.js                 # JavaScript da aplicação
├── styles.css             # Estilos da aplicação
├── 404.html               # Página de erro 404
└── 50x.html               # Página de erro 5xx
```

## 🚀 Processo de Deploy

### Automatizado via Coolify
1. Push para `main` branch
2. Coolify detecta mudanças
3. Build automático da imagem Docker
4. Deploy com zero downtime
5. Health check automático

### Manual (desenvolvimento)
```bash
# Local
git push origin main

# Coolify detecta e faz deploy automático
```

## 📊 Monitoramento

### Logs
```bash
# Desenvolvimento local
make logs

# Produção via Coolify
# Logs disponíveis no dashboard do Coolify
```

### Métricas
- Status da aplicação: `/health`
- Logs de acesso: Nginx access.log
- Logs de erro: Nginx error.log

## 🔧 Troubleshooting

### Container não inicia
```bash
# Verificar logs
make logs

# Testar nginx config
make nginx-test

# Rebuild limpo
make clean && make build && make run
```

### Health check falha
```bash
# Verificar endpoint
curl http://localhost:3000/health

# Verificar status do container
make ps
```

### Performance
- Aplicação otimizada para mobile
- Arquivos estáticos com cache de 1 ano
- Gzip habilitado para todos os text files
- Nginx otimizado para alta concorrência

---

**Nota**: Este setup é otimizado para Coolify e não requer configuração manual de reverse proxy ou SSL - o Coolify gerencia tudo automaticamente.