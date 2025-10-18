# 🔒 Câmera de Segurança IA - Detecção de Pessoas e Rostos

Sistema de câmera de segurança inteligente que detecta pessoas e rostos em tempo real, enviando alertas com capturas de tela via webhook.

## 🚀 Funcionalidades

### 🤖 Detecção IA Dupla
- **Detecção de Pessoas**: Usa TensorFlow.js COCO-SSD para identificar pessoas
- **Detecção de Rostos**: Usa BlazeFace para identificar rostos com alta precisão
- **Confiança Ajustável**: Configuração independente para pessoas (0-1) e rostos (0-1)
- **Detecção Simultânea**: Analisa pessoas e rostos em paralelo

### 📸 Sistema de Captura
- **Captura Automática**: Tira foto automaticamente quando detecta movimento
- **Captura Manual**: Botão para tirar foto sob demanda
- **Overlay de Detecções**: Desenha caixas e labels nas capturas
- **Timestamp**: Adiciona data/hora nas imagens
- **Formato JPEG**: Compressão otimizada para envio

### 🚨 Alertas de Segurança
- **Webhook Inteligente**: Envia JSON estruturado com:
  - Detalhes das detecções (pessoas + rostos)
  - Imagem base64 com overlay de detecções
  - Metadados da câmera e localização
  - Timestamp local e UTC
- **Cooldown Configurável**: Evita spam de alertas
- **Histórico**: Mantém registro das últimas 10 detecções

### 💾 Cache Inteligente
- **Cache Dual**: Gerencia cache separado para modelos de pessoas e rostos
- **Verificação Automática**: Carrega do cache quando disponível
- **Gestão Manual**: Controles para limpar, verificar info e forçar redownload
- **Versionamento**: Invalida cache automaticamente quando versão muda

## 🎮 Interface de Controle

### 🎥 Controles Principais
- **🎥 Start**: Inicia câmera e sistema de detecção
- **⏹️ Stop**: Para sistema e câmera
- **🧪 Testar Webhook**: Envia ping de teste
- **📸 Captura Manual**: Força captura imediata

### ⚙️ Configurações
- **Webhook URL**: Endpoint para receber alertas
- **Confidence Pessoa**: Nível mínimo para detectar pessoas (0-1)
- **Confidence Rosto**: Nível mínimo para detectar rostos (0-1)
- **Cooldown**: Intervalo entre envios em segundos
- **Desenhar Detecções**: Mostrar/ocultar caixas no vídeo
- **Enviar Capturas**: Habilitar/desabilitar envio de imagens

### � Controles do Sistema
- **Limpar Cache**: Remove modelos do cache local
- **Info dos Modelos**: Exibe status de cache e estatísticas
- **Recarregar Modelos**: Força redownload de ambos os modelos

## 📊 Status em Tempo Real

- **Modelo Pessoas**: Estado do carregamento/cache (COCO-SSD)
- **Modelo Faces**: Estado do carregamento/cache (BlazeFace)
- **Câmera**: Status da webcam
- **Detecção**: Resultado atual (pessoas + rostos)
- **Último Envio**: Timestamp e status do último webhook
- **Log**: Mensagens detalhadas do sistema

## � Payload do Webhook

### Alerta de Segurança
```json
{
  "event": "security_detection",
  "timestamp": "2025-10-18T15:30:45.123Z",
  "camera_id": "webcam_001",
  "location": "Entrada Principal",
  "detection_summary": {
    "total_persons": 2,
    "total_faces": 1,
    "total_detections": 3
  },
  "detections": {
    "persons": [
      {
        "confidence": 0.892,
        "bbox": [x, y, width, height],
        "type": "person"
      }
    ],
    "faces": [
      {
        "confidence": 0.945,
        "bbox": [x, y, width, height],
        "type": "face",
        "has_landmarks": true
      }
    ]
  },
  "image": {
    "format": "jpeg",
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    "size": 125840
  },
  "metadata": {
    "user_agent": "Mozilla/5.0...",
    "screen_resolution": "1920x1080",
    "timestamp_local": "18/10/2025 12:30:45"
  }
}
```

### Teste de Conectividade
```json
{
  "event": "test_ping",
  "timestamp": "2025-10-18T15:30:45.123Z",
  "camera_id": "webcam_001",
  "message": "Teste de conectividade da câmera de segurança"
}
```

## 🔐 Recursos de Segurança

### Detecção Inteligente
- **Filtro de Confidence**: Evita falsos positivos
- **Detecção Combinada**: Pessoas E rostos para maior precisão
- **Histórico Local**: Registro das detecções para auditoria
- **Cooldown**: Previne spam de alertas

### Privacidade
- **Processamento Local**: IA roda no navegador
- **Cache Local**: Modelos salvos no dispositivo
- **Sem Armazenamento**: Imagens enviadas via webhook, não salvas

## 🖥️ Compatibilidade

### Navegadores Suportados
- Chrome 90+ (recomendado)
- Firefox 88+
- Safari 14+
- Edge 90+

### Recursos Necessários
- **WebRTC**: getUserMedia para câmera
- **WebGL**: Aceleração para TensorFlow.js
- **ES6+**: async/await, modules
- **Canvas API**: Para desenho e captura
- **localStorage**: Para cache dos modelos

### Permissões
- **Câmera**: Obrigatória para detecção
- **Armazenamento Local**: Para cache dos modelos

## 🚀 Como Usar

1. **Configure o Webhook**: Insira URL do endpoint que receberá os alertas
2. **Ajuste Configurações**: Defina confidence e cooldown conforme necessário
3. **Inicie o Sistema**: Clique "🎥 Start" e permita acesso à câmera
4. **Monitore**: Acompanhe detecções em tempo real
5. **Receba Alertas**: Webhook será acionado automaticamente

## 📱 Responsivo

Interface otimizada para:
- **Desktop**: Experiência completa
- **Tablet**: Layout adaptado
- **Mobile**: Controles acessíveis

## ⚡ Performance

- **Detecção Otimizada**: ~15-30 FPS dependendo do hardware
- **Cache Inteligente**: Carregamento instantâneo após primeiro uso
- **Compressão**: Imagens otimizadas para envio rápido
- **Background Processing**: Não bloqueia interface

Sistema ideal para monitoramento de segurança residencial, comercial ou industrial.# alert-face-web

🚨 **Sistema Policial de Detecção Facial com AI** 

Sistema avançado de monitoramento em tempo real usando TensorFlow.js para detecção de pessoas e faces com webhook automático.

## 🎯 Funcionalidades

- **Detecção AI Dupla**: COCO-SSD (pessoas) + BlazeFace (rostos)
- **Interface Policial**: Tema escuro profissional com status em tempo real
- **Webhook Automático**: Envio de alertas com imagem limpa (base64)
- **Performance Mobile**: Controle de FPS (1-30) otimizado para dispositivos móveis
- **Cache Inteligente**: Modelos salvos localmente para inicialização rápida
- **Log Hacker Style**: Terminal verde monospace com mensagens concisas
- **Controle Anti-Spam**: 1 alerta por rosto detectado + cooldown configurável

## 🚀 Tecnologias

- **TensorFlow.js 4.10.0**: Framework de Machine Learning
- **COCO-SSD 2.2.3**: Detecção de pessoas
- **BlazeFace 0.0.7**: Detecção facial de alta precisão
- **HTML5 Canvas**: Renderização de overlays
- **Web APIs**: getUserMedia, localStorage, fetch

## 📱 Otimização Mobile

- **5 FPS padrão**: Ideal para celulares simples
- **Processamento reduzido**: Configurável de 1-30 FPS
- **Cache persistente**: Evita re-download de modelos
- **Interface responsiva**: Adaptada para telas pequenas

## ⚙️ Configuração

### Controles Disponíveis:
- **Sensibilidade Pessoas**: 0-100% (padrão: 60%)
- **Sensibilidade Rostos**: 0-100% (padrão: 70%)
- **Intervalo Alertas**: 0-60s (padrão: 5s)
- **Performance FPS**: 1-30 FPS (padrão: 5 FPS)
- **Captura Automática**: On/Off
- **Detecções Visuais**: On/Off

## 🔗 Webhook

### Payload de Alerta:
```json
{
  "event": "security_detection",
  "timestamp": "2025-10-18T21:30:15.123Z",
  "camera_id": "webcam_001",
  "location": "Entrada Principal",
  "detection_summary": {
    "total_persons": 1,
    "total_faces": 1,
    "total_detections": 2
  },
  "detections": {
    "persons": [...],
    "faces": [...]
  },
  "image": {
    "format": "jpeg",
    "data": "data:image/jpeg;base64,/9j/4AA...",
    "size": 87456
  }
}
```

## 🔥 Log System

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

---

🔧 **Desenvolvido por**: blazysoftware  
📅 **Versão**: 1.0 (Outubro 2025)  
📄 **Licença**: MIT
