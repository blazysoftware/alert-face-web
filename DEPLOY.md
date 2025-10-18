# Alert Face Web - Deploy no Coolify

Este projeto é uma aplicação frontend estática (HTML + JS + CSS) que pode ser facilmente deployada no Coolify.

## 🚀 Deploy no Coolify

### Método 1: Via GitHub (Recomendado)

1. **Conectar Repositório**:
   - No Coolify, clique em "New Resource"
   - Selecione "Git Repository"
   - Configure o repositório: `https://github.com/blazysoftware/alert-face-web.git`

2. **Configuração do Projeto**:
   ```yaml
   Build Pack: Static
   Port: 80
   Public Port: 443 (HTTPS)
   Root Directory: /
   ```

3. **Build Commands**:
   ```bash
   # Não necessário - projeto estático
   echo "Static site ready"
   ```

4. **Environment Variables** (Opcional):
   ```env
   NODE_ENV=production
   PORT=80
   ```

### Método 2: Upload Manual

1. **Preparar Arquivos**:
   ```bash
   # Criar pasta para deploy
   mkdir alert-face-web-deploy
   cd alert-face-web-deploy
   
   # Copiar arquivos essenciais
   cp ../index.html .
   cp ../app.js .
   cp ../styles.css .
   cp ../README.md .
   cp ../.env.example .
   ```

2. **Zipar Projeto**:
   ```bash
   zip -r alert-face-web.zip *
   ```

3. **Upload no Coolify**:
   - Criar novo "Static Site"
   - Upload do arquivo ZIP
   - Configure porta 80

### Método 3: Docker (Avançado)

Criar `Dockerfile`:
```dockerfile
FROM nginx:alpine

# Copiar arquivos estáticos
COPY index.html /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY README.md /usr/share/nginx/html/

# Configuração do Nginx para SPA
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## ⚙️ Configurações Necessárias

### HTTPS Obrigatório
⚠️ **IMPORTANTE**: O acesso à câmera requer HTTPS em produção!

1. **No Coolify**:
   - Habilitar "Force HTTPS"
   - Configurar certificado SSL automático
   - Usar domínio personalizado

### Variáveis de Ambiente
Configure no Coolify (opcional):
```env
WEBHOOK_URL=https://seu-webhook.com/alerts
DEFAULT_FPS=5
ENABLE_CACHE=true
```

### Headers de Segurança
Configure no Coolify/Nginx:
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header Permissions-Policy "camera=(), microphone=()";
```

## 🔧 Estrutura do Deploy

```
alert-face-web/
├── index.html          # Página principal
├── app.js             # Lógica da aplicação
├── styles.css         # Estilos
├── package.json       # Metadados npm
├── .env.example       # Exemplo de configuração
├── Dockerfile         # Para deploy Docker
├── nginx.conf         # Configuração Nginx
└── README.md          # Documentação
```

## 🌐 Acesso Pós-Deploy

1. **URL do Projeto**: `https://seu-dominio.coolify.app`
2. **Teste de Funcionamento**:
   - Permitir acesso à câmera
   - Verificar carregamento dos modelos AI
   - Testar detecção facial
   - Configurar webhook (opcional)

## 🐛 Troubleshooting

### Câmera Não Funciona
- Verificar se está usando HTTPS
- Permitir acesso à câmera no browser
- Testar em diferentes navegadores

### Modelos AI Não Carregam
- Verificar conexão com CDN do TensorFlow
- Limpar cache do navegador
- Verificar console do browser

### Performance Lenta
- Reduzir FPS para 1-3 em dispositivos móveis
- Desabilitar detecções visuais
- Verificar recursos do servidor

## 📊 Requisitos de Produção

- **HTTPS**: Obrigatório para acesso à câmera
- **Banda**: ~10MB para download inicial dos modelos
- **CPU**: Baixo uso (processamento no cliente)
- **RAM**: ~50MB por usuário
- **Navegador**: Chrome, Firefox, Safari, Edge (moderno)

---

🔧 **Deploy**: Coolify  
🌐 **Tipo**: Static Site  
📱 **Responsivo**: Sim  
🔒 **HTTPS**: Obrigatório