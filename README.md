# 🔒 Sistema de Segurança IA - Alert Face Web# 🔒 Sistema de Segurança IA - Alert Face Web



Sistema avançado de monitoramento em tempo real que detecta pessoas e rostos usando TensorFlow.js, enviando alertas automáticos via webhook.Sistema avançado de monitoramento em tempo real que detecta pessoas e rostos usando TensorFlow.js, enviando alertas automáticos via webhook.



## 🚀 Deploy Rápido## 🚀 Deploy Rápido no Coolify



### Coolify (Recomendado)### Método Git (Recomendado)

1. **Criar Novo Resource** no Coolify1. **Criar Novo Resource** no Coolify

2. **Git Repository**: `https://github.com/blazysoftware/alert-face-web.git`2. **Git Repository**: `https://github.com/blazysoftware/alert-face-web.git`

3. **Build Pack**: Static Site3. **Build Pack**: Static Site

4. **Port**: 804. **Port**: 80

5. **Enable HTTPS**: ✅ (Obrigatório para câmera)5. **Enable HTTPS**: ✅ (Obrigatório para câmera)



### Estrutura do Projeto### Estrutura Pronta para Deploy

``````

📁 alert-face-web/📁 Projeto (Static Site)

├── index.html     # Interface principal├── index.html     # Interface principal

├── app.js         # Lógica IA + Webhooks  ├── app.js         # Lógica AI + Webhooks  

├── styles.css     # Tema policial├── styles.css     # Tema policial

├── Dockerfile     # Container nginx├── Dockerfile     # Deploy containerizado

└── README.md      # Documentação└── DEPLOY.md      # Guia completo de deploy

``````



⚠️ **HTTPS Obrigatório**: Browsers exigem HTTPS para acesso à câmera⚠️ **HTTPS Obrigatório**: Browsers exigem HTTPS para acesso à câmera



## 🎯 Funcionalidades Principais## 🚀 Funcionalidades



### 🤖 Detecção IA Dupla### 🤖 Detecção IA Dupla

- **COCO-SSD**: Detecção de pessoas com alta precisão- **Detecção de Pessoas**: Usa TensorFlow.js COCO-SSD para identificar pessoas

- **BlazeFace**: Detecção facial otimizada- **Detecção de Rostos**: Usa BlazeFace para identificar rostos com alta precisão

- **Confiança Ajustável**: Configuração independente (0-100%)- **Confiança Ajustável**: Configuração independente para pessoas (0-1) e rostos (0-1)

- **Processamento Paralelo**: Análise simultânea de pessoas e rostos- **Detecção Simultânea**: Analisa pessoas e rostos em paralelo



### 📸 Sistema de Captura Inteligente### 📸 Sistema de Captura

- **Captura Automática**: Disparo automático na detecção- **Captura Automática**: Tira foto automaticamente quando detecta movimento

- **Captura Manual**: Botão de captura sob demanda- **Captura Manual**: Botão para tirar foto sob demanda

- **Overlay Visual**: Caixas delimitadoras com labels- **Overlay de Detecções**: Desenha caixas e labels nas capturas

- **Timestamp**: Data/hora nas imagens- **Timestamp**: Adiciona data/hora nas imagens

- **Formato Otimizado**: JPEG comprimido para webhook- **Formato JPEG**: Compressão otimizada para envio



### 🚨 Alertas em Tempo Real### 🚨 Alertas de Segurança

- **Webhook Estruturado**: JSON completo com metadados- **Webhook Inteligente**: Envia JSON estruturado com:

- **Cooldown Inteligente**: Evita spam de notificações  - Detalhes das detecções (pessoas + rostos)

- **Histórico Local**: Registro das últimas 10 detecções  - Imagem base64 com overlay de detecções

- **Status de Envio**: Confirmação de entrega  - Metadados da câmera e localização

  - Timestamp local e UTC

### 💾 Cache Avançado- **Cooldown Configurável**: Evita spam de alertas

- **Modelos Locais**: Armazenamento no localStorage- **Histórico**: Mantém registro das últimas 10 detecções

- **Carregamento Rápido**: Inicialização instantânea

- **Gestão Manual**: Controles de limpeza e redownload### 💾 Cache Inteligente

- **Versionamento**: Atualização automática de modelos- **Cache Dual**: Gerencia cache separado para modelos de pessoas e rostos

- **Verificação Automática**: Carrega do cache quando disponível

## 🎮 Interface de Controle- **Gestão Manual**: Controles para limpar, verificar info e forçar redownload

- **Versionamento**: Invalida cache automaticamente quando versão muda

### Controles Principais

- **🎥 Iniciar Sistema**: Ativa câmera e detecção## 🎮 Interface de Controle

- **⏹️ Parar Sistema**: Desativa monitoramento

- **📸 Captura Manual**: Força captura imediata### 🎥 Controles Principais

- **🧪 Testar Webhook**: Ping de conectividade- **🎥 Start**: Inicia câmera e sistema de detecção

- **⏹️ Stop**: Para sistema e câmera

### Configurações Avançadas- **🧪 Testar Webhook**: Envia ping de teste

- **Webhook URL**: Endpoint para alertas- **📸 Captura Manual**: Força captura imediata

- **Sensibilidade Pessoas**: 0-100% (padrão: 60%)

- **Sensibilidade Rostos**: 0-100% (padrão: 70%)### ⚙️ Configurações

- **Intervalo Alertas**: 0-60s (padrão: 5s)- **Webhook URL**: Endpoint para receber alertas

- **Performance FPS**: 1-30 FPS (padrão: 5 FPS)- **Confidence Pessoa**: Nível mínimo para detectar pessoas (0-1)

- **Detecções Visuais**: Mostrar/ocultar overlay- **Confidence Rosto**: Nível mínimo para detectar rostos (0-1)

- **Envio Automático**: Habilitar/desabilitar webhook- **Cooldown**: Intervalo entre envios em segundos

- **Desenhar Detecções**: Mostrar/ocultar caixas no vídeo

## 📡 Webhook Payload- **Enviar Capturas**: Habilitar/desabilitar envio de imagens



### Alerta de Detecção### � Controles do Sistema

```json- **Limpar Cache**: Remove modelos do cache local

{- **Info dos Modelos**: Exibe status de cache e estatísticas

  "event": "security_detection",- **Recarregar Modelos**: Força redownload de ambos os modelos

  "timestamp": "2025-10-18T15:30:45.123Z",

  "camera_id": "webcam_001",## 📊 Status em Tempo Real

  "location": "Entrada Principal",

  "detection_summary": {- **Modelo Pessoas**: Estado do carregamento/cache (COCO-SSD)

    "total_persons": 1,- **Modelo Faces**: Estado do carregamento/cache (BlazeFace)

    "total_faces": 1,- **Câmera**: Status da webcam

    "total_detections": 2- **Detecção**: Resultado atual (pessoas + rostos)

  },- **Último Envio**: Timestamp e status do último webhook

  "detections": {- **Log**: Mensagens detalhadas do sistema

    "persons": [

      {## � Payload do Webhook

        "confidence": 0.892,

        "bbox": [x, y, width, height],### Alerta de Segurança

        "type": "person"```json

      }{

    ],  "event": "security_detection",

    "faces": [  "timestamp": "2025-10-18T15:30:45.123Z",

      {  "camera_id": "webcam_001",

        "confidence": 0.945,  "location": "Entrada Principal",

        "bbox": [x, y, width, height],  "detection_summary": {

        "type": "face"    "total_persons": 2,

      }    "total_faces": 1,

    ]    "total_detections": 3

  },  },

  "image": {  "detections": {

    "format": "jpeg",    "persons": [

    "data": "data:image/jpeg;base64,/9j/4AA...",      {

    "size": 87456        "confidence": 0.892,

  },        "bbox": [x, y, width, height],

  "metadata": {        "type": "person"

    "user_agent": "Mozilla/5.0...",      }

    "screen_resolution": "1920x1080",    ],

    "timestamp_local": "18/10/2025 12:30:45"    "faces": [

  }      {

}        "confidence": 0.945,

```        "bbox": [x, y, width, height],

        "type": "face",

### Teste de Conectividade        "has_landmarks": true

```json      }

{    ]

  "event": "test_ping",  },

  "timestamp": "2025-10-18T15:30:45.123Z",  "image": {

  "camera_id": "webcam_001",    "format": "jpeg",

  "message": "Teste de conectividade - Sistema operacional"    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",

}    "size": 125840

```  },

  "metadata": {

## 🛡️ Segurança & Privacidade    "user_agent": "Mozilla/5.0...",

    "screen_resolution": "1920x1080",

### Processamento Local    "timestamp_local": "18/10/2025 12:30:45"

- **IA no Browser**: Modelos executam localmente  }

- **Cache Seguro**: Dados salvos apenas no dispositivo}

- **Sem Upload**: Imagens não vão para servidores externos```

- **Webhook Opcional**: Sistema funciona offline

### Teste de Conectividade

### Controle de Qualidade```json

- **Filtros de Confiança**: Elimina falsos positivos{

- **Detecção Combinada**: Validação cruzada pessoas+rostos  "event": "test_ping",

- **Anti-Spam**: Cooldown configurável  "timestamp": "2025-10-18T15:30:45.123Z",

- **Auditoria Local**: Histórico de detecções  "camera_id": "webcam_001",

  "message": "Teste de conectividade da câmera de segurança"

## 🖥️ Compatibilidade}

```

### Navegadores Suportados

- ✅ Chrome 90+ (recomendado)## 🔐 Recursos de Segurança

- ✅ Firefox 88+

- ✅ Safari 14+### Detecção Inteligente

- ✅ Edge 90+- **Filtro de Confidence**: Evita falsos positivos

- **Detecção Combinada**: Pessoas E rostos para maior precisão

### Tecnologias Utilizadas- **Histórico Local**: Registro das detecções para auditoria

- **TensorFlow.js 4.10.0**: Framework IA- **Cooldown**: Previne spam de alertas

- **COCO-SSD 2.2.3**: Detecção de pessoas

- **BlazeFace 0.0.7**: Detecção facial### Privacidade

- **WebRTC**: Acesso à câmera- **Processamento Local**: IA roda no navegador

- **Canvas API**: Renderização overlay- **Cache Local**: Modelos salvos no dispositivo

- **localStorage**: Cache de modelos- **Sem Armazenamento**: Imagens enviadas via webhook, não salvas



### Requisitos Mínimos## 🖥️ Compatibilidade

- **WebGL**: Aceleração GPU

- **getUserMedia**: Acesso câmera### Navegadores Suportados

- **ES6+**: async/await, modules- Chrome 90+ (recomendado)

- **HTTPS**: Obrigatório para câmera- Firefox 88+

- Safari 14+

## 📱 Otimização Mobile- Edge 90+



### Performance Adaptável### Recursos Necessários

| Dispositivo | FPS Recomendado | Uso CPU |- **WebRTC**: getUserMedia para câmera

|-------------|-----------------|---------|- **WebGL**: Aceleração para TensorFlow.js

| Mobile Simples | 1-3 FPS | Baixo |- **ES6+**: async/await, modules

| Mobile Moderno | 5-10 FPS | Médio |- **Canvas API**: Para desenho e captura

| Desktop | 15-30 FPS | Alto |- **localStorage**: Para cache dos modelos



### Interface Responsiva### Permissões

- **Layout Adaptado**: Otimizado para telas pequenas- **Câmera**: Obrigatória para detecção

- **Controles Acessíveis**: Botões dimensionados para touch- **Armazenamento Local**: Para cache dos modelos

- **Performance Configurável**: FPS ajustável 1-30

## 🚀 Como Usar

## 🔧 Desenvolvimento Local

1. **Configure o Webhook**: Insira URL do endpoint que receberá os alertas

```bash2. **Ajuste Configurações**: Defina confidence e cooldown conforme necessário

# Servidor HTTP simples3. **Inicie o Sistema**: Clique "🎥 Start" e permita acesso à câmera

python3 -m http.server 80804. **Monitore**: Acompanhe detecções em tempo real

5. **Receba Alertas**: Webhook será acionado automaticamente

# Acesso local

http://localhost:8080## 📱 Responsivo



# Para HTTPS local (necessário para câmera)Interface otimizada para:

# Use ngrok ou mkcert para certificados locais- **Desktop**: Experiência completa

```- **Tablet**: Layout adaptado

- **Mobile**: Controles acessíveis

## 📊 Log System

## ⚡ Performance

Terminal estilo hacker com códigos de status:

- **Detecção Otimizada**: ~15-30 FPS dependendo do hardware

```bash- **Cache Inteligente**: Carregamento instantâneo após primeiro uso

15:30:15 [OK] COCO-SSD cached (5.2MB)- **Compressão**: Imagens otimizadas para envio rápido

15:30:16 [OK] BlazeFace cached (1.1MB)  - **Background Processing**: Não bloqueia interface

15:30:17 [OK] CAMERA ACTIVE

15:30:20 [ALERT] PERSON detected (conf: 89%)Sistema ideal para monitoramento de segurança residencial, comercial ou industrial.# alert-face-web

15:30:21 [ALERT] FACE detected (conf: 94%)

15:30:22 [OK] Webhook sent (200 OK)🚨 **Sistema Policial de Detecção Facial com AI** 

```

Sistema avançado de monitoramento em tempo real usando TensorFlow.js para detecção de pessoas e faces com webhook automático.

### Códigos de Status

- `[OK]` - Operação bem-sucedida## 🎯 Funcionalidades

- `[ALERT]` - Detecção ativa

- `[!]` - Aviso do sistema- **Detecção AI Dupla**: COCO-SSD (pessoas) + BlazeFace (rostos)

- `[X]` - Erro ou falha- **Interface Policial**: Tema escuro profissional com status em tempo real

- `>>` - Informação geral- **Webhook Automático**: Envio de alertas com imagem limpa (base64)

- **Performance Mobile**: Controle de FPS (1-30) otimizado para dispositivos móveis

## 🐛 Troubleshooting- **Cache Inteligente**: Modelos salvos localmente para inicialização rápida

- **Log Hacker Style**: Terminal verde monospace com mensagens concisas

### Problemas Comuns- **Controle Anti-Spam**: 1 alerta por rosto detectado + cooldown configurável



**Câmera não funciona:**## 🚀 Tecnologias

- ✅ Verificar permissões do browser

- ✅ Usar HTTPS (obrigatório)- **TensorFlow.js 4.10.0**: Framework de Machine Learning

- ✅ Testar em modo incógnito- **COCO-SSD 2.2.3**: Detecção de pessoas

- ✅ Verificar outros browsers- **BlazeFace 0.0.7**: Detecção facial de alta precisão

- **HTML5 Canvas**: Renderização de overlays

**Performance lenta:**- **Web APIs**: getUserMedia, localStorage, fetch

- ✅ Reduzir FPS para 1-3

- ✅ Desabilitar overlay visual## 📱 Otimização Mobile

- ✅ Limpar cache do browser

- ✅ Fechar outras abas- **5 FPS padrão**: Ideal para celulares simples

- **Processamento reduzido**: Configurável de 1-30 FPS

**Webhook falha:**- **Cache persistente**: Evita re-download de modelos

- ✅ Verificar URL e conectividade- **Interface responsiva**: Adaptada para telas pequenas

- ✅ Testar com webhook.site

- ✅ Verificar CORS do servidor## ⚙️ Configuração

- ✅ Checar logs do console

### Controles Disponíveis:

**Cache de modelos:**- **Sensibilidade Pessoas**: 0-100% (padrão: 60%)

- ✅ Usar botão "Limpar Cache"- **Sensibilidade Rostos**: 0-100% (padrão: 70%)

- ✅ Forçar redownload dos modelos- **Intervalo Alertas**: 0-60s (padrão: 5s)

- ✅ Verificar espaço localStorage- **Performance FPS**: 1-30 FPS (padrão: 5 FPS)

- ✅ Desabilitar ad-blockers- **Captura Automática**: On/Off

- **Detecções Visuais**: On/Off

## 🚀 Como Usar

## 🔗 Webhook

1. **Configuração Inicial**

   - Abrir `index.html` no navegador### Payload de Alerta:

   - Configurar URL do webhook (opcional)```json

   - Ajustar sensibilidade e FPS{

  "event": "security_detection",

2. **Ativação do Sistema**  "timestamp": "2025-10-18T21:30:15.123Z",

   - Clicar "🚨 ATIVAR SISTEMA"  "camera_id": "webcam_001",

   - Permitir acesso à câmera  "location": "Entrada Principal",

   - Aguardar carregamento dos modelos  "detection_summary": {

    "total_persons": 1,

3. **Monitoramento Ativo**    "total_faces": 1,

   - Acompanhar detecções em tempo real    "total_detections": 2

   - Verificar logs do terminal  },

   - Receber alertas via webhook  "detections": {

    "persons": [...],

4. **Manutenção**    "faces": [...]

   - Monitorar performance  },

   - Ajustar configurações conforme necessário  "image": {

   - Limpar cache quando necessário    "format": "jpeg",

    "data": "data:image/jpeg;base64,/9j/4AA...",

---    "size": 87456

  }

🔧 **Desenvolvido por**: [blazysoftware](https://github.com/blazysoftware)  }

📅 **Versão**: 1.0.0 (Outubro 2025)  ```

📄 **Licença**: MIT  

🌟 **Repositório**: [alert-face-web](https://github.com/blazysoftware/alert-face-web)## 🔥 Log System

Log no estilo hacker com mensagens concisas:

```bash
21:30:15 [OK] COCO-SSD cached
21:30:16 [OK] BlazeFace cached  
21:30:17 [OK] SYSTEM ACTIVE
21:30:20 [ALERT] FACE ALERT sent (200)
```

**Ícones do Terminal:**
- `>>` Info
- `[OK]` Sucesso  
- `[!]` Aviso
- `[X]` Erro
- `[ALERT]` Detecção

## 🛡️ Segurança

- **Processamento Local**: Todos os dados ficam no browser
- **Sem Upload**: Imagens não são enviadas para servidores externos
- **Cache Seguro**: Modelos salvos apenas localmente
- **Webhook Opcional**: Sistema funciona offline

## 📋 Como Usar

1. **Abrir**: `index.html` no navegador
2. **Configurar**: URL do webhook (opcional)
3. **Permitir**: Acesso à câmera
4. **Ativar**: Sistema de monitoramento
5. **Monitorar**: Detecções em tempo real

## 🔧 Desenvolvimento

```bash
# Servidor local para testes
python3 -m http.server 8080

# Acesso via:
http://localhost:8080
```

## 📊 Status dos Modelos

- **COCO-SSD**: ~5MB (lite_mobilenet_v2)
- **BlazeFace**: ~1MB (tensorflow.js)
- **Cache**: localStorage + IndexedDB
- **Compatibilidade**: Chrome, Firefox, Safari, Edge

## 🎮 Controles

- **🚨 ATIVAR SISTEMA**: Iniciar monitoramento
- **⏹️ DESATIVAR**: Parar sistema
- **📸 CAPTURA IMEDIATA**: Foto manual com webhook
- **🧪 TESTE COMUNICAÇÃO**: Verificar webhook
- **🗑️ LIMPAR CACHE**: Reset dos modelos
- **ℹ️ DETALHES**: Info dos modelos

## 📈 Performance

| Dispositivo | FPS Recomendado | Uso CPU |
|-------------|-----------------|---------|
| Mobile Simples | 1-3 FPS | Baixo |
| Mobile Moderno | 5-10 FPS | Médio |
| Desktop | 15-30 FPS | Alto |

## 🐛 Troubleshooting

**Câmera não funciona:**
- Verificar permissões do browser
- Usar HTTPS (obrigatório para câmera)
- Testar em outros browsers

**Performance lenta:**
- Reduzir FPS para 1-3
- Desabilitar detecções visuais
- Limpar cache do browser

**Webhook falha:**
- Verificar URL e conectividade
- Testar com webhook.site
- Verificar CORS do servidor

## ⏪ Sistema de Captura Prévia (NOVO!)

### 🎯 Problema Resolvido
- **Antes**: Capturava no momento exato da detecção (pessoa tapando rosto)
- **Agora**: Captura frames anteriores quando a pessoa ainda estava visível

### 🔧 Como Configurar
No menu lateral, ajuste o **"⏪ Delay Captura (Frames Atrás)"**:
- **0 frames**: Captura atual (comportamento anterior)
- **4 frames**: ~800ms atrás (padrão recomendado)
- **6-8 frames**: Para movimento mais lento

### 📊 Timing por FPS
| FPS Setting | 4 Frames Atrás | 6 Frames Atrás | 8 Frames Atrás |
|-------------|----------------|----------------|----------------|
| 5 FPS | 800ms | 1.2s | 1.6s |
| 10 FPS | 400ms | 600ms | 800ms |
| 15 FPS | 267ms | 400ms | 533ms |

### � Dicas de Uso
- **Movimento Lento**: 6-8 frames
- **Movimento Rápido**: 2-4 frames  
- **Teste**: Use captura manual para testar diferentes valores
- **Buffer**: Sistema mantém últimos 10 frames automaticamente

---

�🔧 **Desenvolvido por**: [blazysoftware](https://github.com/blazysoftware)  
📅 **Versão**: 1.1.0 (Outubro 2025) - **Sistema de Captura Prévia**  
📄 **Licença**: MIT  
🌟 **Repositório**: [alert-face-web](https://github.com/blazysoftware/alert-face-web)
