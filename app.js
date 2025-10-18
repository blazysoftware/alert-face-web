/* Código principal (detecção + envio webhook) */
const els = {
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  capture: document.getElementById('capture'),
  
  // Status indicators
  systemStatus: document.getElementById('systemStatus'),
  currentTime: document.getElementById('currentTime'),
  currentDate: document.getElementById('currentDate'),
  recordingIndicator: document.getElementById('recordingIndicator'),
  
  // Model status
  modelStatus: document.getElementById('modelStatus'),
  faceModelStatus: document.getElementById('faceModelStatus'),
  
  // Detection stats
  personCount: document.getElementById('personCount'),
  faceCount: document.getElementById('faceCount'),
  totalDetections: document.getElementById('totalDetections'),
  detectStatus: document.getElementById('detectStatus'),
  
  // Communication
  webhookUrl: document.getElementById('webhookUrl'),
  lastSend: document.getElementById('lastSend'),
  cameraStatus: document.getElementById('cameraStatus'),
  
  // Controls
  confidence: document.getElementById('confidence'),
  confidenceValue: document.getElementById('confidenceValue'),
  faceConfidence: document.getElementById('faceConfidence'),
  faceConfidenceValue: document.getElementById('faceConfidenceValue'),
  cooldown: document.getElementById('cooldown'),
  cooldownValue: document.getElementById('cooldownValue'),
  performance: document.getElementById('performance'),
  performanceValue: document.getElementById('performanceValue'),
  drawBoxes: document.getElementById('drawBoxes'),
  captureEnabled: document.getElementById('captureEnabled'),
  
  // Buttons
  btnStart: document.getElementById('btnStart'),
  btnStop: document.getElementById('btnStop'),
  btnTest: document.getElementById('btnTest'),
  btnCapture: document.getElementById('btnCapture'),
  btnClearCache: document.getElementById('btnClearCache'),
  btnModelInfo: document.getElementById('btnModelInfo'),
  btnForceDownload: document.getElementById('btnForceDownload'),
  toggleBoxes: document.getElementById('toggleBoxes'),
  toggleFullscreen: document.getElementById('toggleFullscreen'),
  
  // Event log
  eventLog: document.getElementById('eventLog'),
};

const state = {
  stream: null,
  personModel: null,
  faceModel: null,
  running: false,
  rafId: null,
  lastPersonPresent: false,
  lastFacePresent: false,
  lastSendAt: 0,
  detectionHistory: [],
  currentDetections: {
    persons: 0,
    faces: 0,
    total: 0
  },
  systemStartTime: null,
  lastLogMessages: new Set(), // Evitar duplicação de logs
  faceAlertSent: false, // Controle de 1 alerta por rosto
};

// Sistema de Interface Policial
const PoliceUI = {
  init() {
    this.updateClock();
    this.setupRangeSliders();
    this.updateDate();
    setInterval(() => this.updateClock(), 1000);
  },

  updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour12: false });
    els.currentTime.textContent = time;
  },

  updateDate() {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    els.currentDate.textContent = date;
  },

  setupRangeSliders() {
    // Confidence Pessoa
    els.confidence.addEventListener('input', (e) => {
      const value = Math.round(e.target.value * 100);
      els.confidenceValue.textContent = `${value}%`;
    });

    // Confidence Rosto
    els.faceConfidence.addEventListener('input', (e) => {
      const value = Math.round(e.target.value * 100);
      els.faceConfidenceValue.textContent = `${value}%`;
    });

    // Cooldown
    els.cooldown.addEventListener('input', (e) => {
      const value = e.target.value;
      els.cooldownValue.textContent = `${value}s`;
    });

    // Performance
    els.performance.addEventListener('input', (e) => {
      const fps = parseInt(e.target.value);
      let label = '';
      if (fps <= 3) label = 'Ultra Low';
      else if (fps <= 5) label = 'Mobile';
      else if (fps <= 10) label = 'Low';
      else if (fps <= 15) label = 'Medium';
      else if (fps <= 20) label = 'High';
      else label = 'Ultra';
      els.performanceValue.textContent = `${fps} FPS (${label})`;
    });
  },

  updateSystemStatus(status, isOnline = false) {
    if (isOnline) {
      els.systemStatus.textContent = '🟢 SISTEMA ATIVO';
      els.systemStatus.style.color = 'var(--accent-green)';
      els.recordingIndicator.classList.add('active');
    } else {
      els.systemStatus.textContent = '🔴 SISTEMA OFFLINE';
      els.systemStatus.style.color = 'var(--accent-red)';
      els.recordingIndicator.classList.remove('active');
    }
  },

  updateDetectionStats(persons, faces) {
    state.currentDetections.persons = persons;
    state.currentDetections.faces = faces;
    state.currentDetections.total = persons + faces;

    els.personCount.textContent = persons;
    els.faceCount.textContent = faces;
    els.totalDetections.textContent = state.currentDetections.total;

    // Atualizar status visual
    if (state.currentDetections.total > 0) {
      const parts = [];
      if (persons > 0) parts.push(`${persons} pessoa(s)`);
      if (faces > 0) parts.push(`${faces} rosto(s)`);
      els.detectStatus.textContent = `🚨 ALERTA: ${parts.join(' + ')} detectado(s)`;
      els.detectStatus.style.color = 'var(--accent-red)';
      els.detectStatus.style.fontWeight = 'bold';
    } else {
      els.detectStatus.textContent = '🔍 Monitorando área...';
      els.detectStatus.style.color = 'var(--text-secondary)';
      els.detectStatus.style.fontWeight = 'normal';
    }
  },

  addLogEntry(message, type = 'info') {
    // Evitar logs duplicados nos últimos 5 segundos
    const logKey = `${type}:${message}`;
    if (state.lastLogMessages.has(logKey)) return;
    
    state.lastLogMessages.add(logKey);
    setTimeout(() => state.lastLogMessages.delete(logKey), 5000);
    
    const time = new Date().toLocaleTimeString('pt-BR', {hour12: false}).slice(-8);
    const icons = {
      info: '>>',
      success: '[OK]',
      warning: '[!]',
      error: '[X]',
      detection: '[ALERT]'
    };
    
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span style="color:#00ff00">${time}</span> ${icons[type]} ${message}`;
    
    els.eventLog.insertBefore(entry, els.eventLog.firstChild);
    
    // Manter apenas últimas 10 entradas
    const entries = els.eventLog.querySelectorAll('.log-entry');
    if (entries.length > 10) {
      entries[entries.length - 1].remove();
    }
  },

  updateModelStatus(modelType, status) {
    const element = modelType === 'person' ? els.modelStatus : els.faceModelStatus;
    const statusMap = {
      loading: { text: '⏳ Carregando...', color: 'var(--warning)' },
      cache: { text: '💾 Cache Local', color: 'var(--accent-blue)' },
      downloading: { text: '⬇️ Baixando...', color: 'var(--warning)' },
      ready: { text: '✅ Operacional', color: 'var(--success)' },
      error: { text: '❌ Erro', color: 'var(--danger)' }
    };
    
    const statusInfo = statusMap[status] || statusMap.loading;
    element.textContent = statusInfo.text;
    element.style.color = statusInfo.color;
  },

  updateCameraStatus(status) {
    const statusMap = {
      offline: { text: '🔴 Offline', color: 'var(--danger)' },
      connecting: { text: '🟡 Conectando...', color: 'var(--warning)' },
      online: { text: '🟢 Online', color: 'var(--success)' },
      error: { text: '❌ Erro de Conexão', color: 'var(--danger)' }
    };
    
    const statusInfo = statusMap[status] || statusMap.offline;
    els.cameraStatus.textContent = statusInfo.text;
    els.cameraStatus.style.color = statusInfo.color;
  }
};

const Camera = {
  async start(videoEl) {
    try {
      PoliceUI.updateCameraStatus('connecting');
      PoliceUI.addLogEntry('init camera...', 'info');
      
      const constraints = { 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }, 
          facingMode: 'user' // Front camera for better detection
        }, 
        audio: false 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      
      // Aguardar o vídeo carregar completamente
      await new Promise((resolve, reject) => {
        videoEl.onloadeddata = () => {
          videoEl.play().then(resolve).catch(reject);
        };
        videoEl.onerror = reject;
      });
      
      state.stream = stream;
      
      // Aguardar metadados do vídeo
      await new Promise(resolve => {
        if (videoEl.videoWidth && videoEl.videoHeight) {
          resolve();
        } else {
          videoEl.onloadedmetadata = resolve;
        }
      });
      
      const { videoWidth, videoHeight } = videoEl;
      els.overlay.width = videoWidth;
      els.overlay.height = videoHeight;
      els.capture.width = videoWidth;
      els.capture.height = videoHeight;
      
      PoliceUI.updateCameraStatus('online');
      PoliceUI.addLogEntry(`cam: ${videoWidth}x${videoHeight}`, 'success');
      
      return { width: videoWidth, height: videoHeight };
      
    } catch (error) {
      PoliceUI.updateCameraStatus('error');
      PoliceUI.addLogEntry(`cam error: ${error.message}`, 'error');
      throw error;
    }
  },
  
  stop() {
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
      state.stream = null;
      PoliceUI.updateCameraStatus('offline');
      PoliceUI.addLogEntry('cam disconnected', 'info');
    }
  },
  
  isActive() {
    return state.stream && els.video.videoWidth > 0 && els.video.videoHeight > 0;
  }
};

const ModelCache = {
  CACHE_KEY_PERSON: 'tensorflowModel_cocoSsd',
  CACHE_KEY_FACE: 'tensorflowModel_blazeFace',
  CACHE_VERSION: '2.2.3',
  
  async saveToCache(modelType, modelData) {
    try {
      const cacheKey = modelType === 'person' ? this.CACHE_KEY_PERSON : this.CACHE_KEY_FACE;
      const cacheData = {
        version: this.CACHE_VERSION,
        timestamp: Date.now(),
        data: modelData
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
      return false;
    }
  },

  async loadFromCache(modelType) {
    try {
      const cacheKey = modelType === 'person' ? this.CACHE_KEY_PERSON : this.CACHE_KEY_FACE;
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // Verificar se a versão do cache é compatível
      if (cacheData.version !== this.CACHE_VERSION) {
        this.clearCache(modelType);
        return null;
      }
      
      return cacheData;
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
      this.clearCache(modelType);
      return null;
    }
  },

  clearCache(modelType = 'all') {
    try {
      if (modelType === 'all' || modelType === 'person') {
        localStorage.removeItem(this.CACHE_KEY_PERSON);
      }
      if (modelType === 'all' || modelType === 'face') {
        localStorage.removeItem(this.CACHE_KEY_FACE);
      }
      return true;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return false;
    }
  },

  getCacheInfo() {
    try {
      const personCache = localStorage.getItem(this.CACHE_KEY_PERSON);
      const faceCache = localStorage.getItem(this.CACHE_KEY_FACE);
      
      const result = { person: { cached: false }, face: { cached: false } };
      
      if (personCache) {
        const data = JSON.parse(personCache);
        const date = new Date(data.timestamp);
        result.person = {
          cached: true,
          version: data.version,
          savedAt: date.toLocaleString('pt-BR'),
          size: Math.round(personCache.length / 1024)
        };
      }
      
      if (faceCache) {
        const data = JSON.parse(faceCache);
        const date = new Date(data.timestamp);
        result.face = {
          cached: true,
          version: data.version,
          savedAt: date.toLocaleString('pt-BR'),
          size: Math.round(faceCache.length / 1024)
        };
      }
      
      return result;
    } catch (error) {
      return { person: { cached: false }, face: { cached: false } };
    }
  }
};

const Detector = {
  async loadPersonModel(forceDownload = false) {
    try {
      let cachedData = null;
      
      if (!forceDownload) {
        PoliceUI.updateModelStatus('person', 'loading');
        cachedData = await ModelCache.loadFromCache('person');
        
        if (cachedData) {
          PoliceUI.updateModelStatus('person', 'cache');
          PoliceUI.addLogEntry('COCO-SSD cached', 'success');
        }
      }
      
      if (!cachedData || forceDownload) {
        PoliceUI.updateModelStatus('person', 'downloading');
        PoliceUI.addLogEntry('dl COCO-SSD...', 'info');
      }
      
      state.personModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      
      if (!cachedData || forceDownload) {
        const modelInfo = {
          modelType: 'coco-ssd',
          base: 'lite_mobilenet_v2',
          downloadedAt: Date.now()
        };
        
        await ModelCache.saveToCache('person', modelInfo);
        PoliceUI.addLogEntry('COCO-SSD saved', 'success');
      }
      
      PoliceUI.updateModelStatus('person', 'ready');
      
    } catch (error) {
      PoliceUI.updateModelStatus('person', 'error');
      PoliceUI.addLogEntry(`COCO-SSD error: ${error.message}`, 'error');
      throw error;
    }
  },

  async loadFaceModel(forceDownload = false) {
    try {
      let cachedData = null;
      
      if (!forceDownload) {
        PoliceUI.updateModelStatus('face', 'loading');
        cachedData = await ModelCache.loadFromCache('face');
        
        if (cachedData) {
          PoliceUI.updateModelStatus('face', 'cache');
          PoliceUI.addLogEntry('BlazeFace cached', 'success');
        }
      }
      
      if (!cachedData || forceDownload) {
        PoliceUI.updateModelStatus('face', 'downloading');
        PoliceUI.addLogEntry('dl BlazeFace...', 'info');
      }
      
      state.faceModel = await blazeface.load();
      
      if (!cachedData || forceDownload) {
        const modelInfo = {
          modelType: 'blazeface',
          downloadedAt: Date.now()
        };
        
        await ModelCache.saveToCache('face', modelInfo);
        PoliceUI.addLogEntry('BlazeFace saved', 'success');
      }
      
      PoliceUI.updateModelStatus('face', 'ready');
      
    } catch (error) {
      PoliceUI.updateModelStatus('face', 'error');
      PoliceUI.addLogEntry(`BlazeFace error: ${error.message}`, 'error');
      throw error;
    }
  },

  async loadAll(forceDownload = false) {
    await Promise.all([
      this.loadPersonModel(forceDownload),
      this.loadFaceModel(forceDownload)
    ]);
    PoliceUI.addLogEntry('AI models ready', 'success');
  },

  async detectPersons(videoEl) {
    if (!state.personModel) return [];
    const preds = await state.personModel.detect(videoEl);
    return preds.filter(p => p.class === 'person');
  },

  async detectFaces(videoEl) {
    if (!state.faceModel) return [];
    const preds = await state.faceModel.estimateFaces(videoEl, false);
    return preds;
  },

  async detectAll(videoEl) {
    const [persons, faces] = await Promise.all([
      this.detectPersons(videoEl),
      this.detectFaces(videoEl)
    ]);
    
    return { persons, faces };
  },

  async clearCache() {
    const success = ModelCache.clearCache('all');
    if (success) {
      PoliceUI.addLogEntry('Cache cleared', 'success');
      PoliceUI.updateModelStatus('person', 'loading');
      PoliceUI.updateModelStatus('face', 'loading');
    } else {
      PoliceUI.addLogEntry('Cache clear failed', 'error');
    }
    return success;
  },

  async getModelInfo() {
    return ModelCache.getCacheInfo();
  }
};

const Drawer = {
  clear() {
    const ctx = els.overlay.getContext('2d');
    ctx.clearRect(0, 0, els.overlay.width, els.overlay.height);
  },
  
  persons(persons) {
    const ctx = els.overlay.getContext('2d');
    ctx.lineWidth = 3;
    ctx.font = '16px system-ui, sans-serif';
    
    persons.forEach(p => {
      const [x, y, w, h] = p.bbox;
      
      // Desenhar caixa da pessoa
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0,255,136,0.15)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      
      // Label da pessoa
      const label = `👤 Pessoa ${(p.score * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width + 12;
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(x, y - 25, textWidth, 25);
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 6, y - 6);
    });
  },
  
  faces(faces) {
    const ctx = els.overlay.getContext('2d');
    ctx.lineWidth = 2;
    ctx.font = '14px system-ui, sans-serif';
    
    faces.forEach((face, index) => {
      const [x, y, w, h] = [
        face.topLeft[0],
        face.topLeft[1],
        face.bottomRight[0] - face.topLeft[0],
        face.bottomRight[1] - face.topLeft[1]
      ];
      
      // Desenhar caixa do rosto
      ctx.strokeStyle = '#ff6b6b';
      ctx.fillStyle = 'rgba(255,107,107,0.15)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      
      // Label do rosto
      const confidence = face.probability ? face.probability[0] : 1;
      const label = `😊 Face ${(confidence * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width + 12;
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(x, y - 20, textWidth, 20);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(label, x + 6, y - 4);
      
      // Desenhar pontos de referência se disponíveis
      if (face.landmarks) {
        ctx.fillStyle = '#ff6b6b';
        face.landmarks.forEach(landmark => {
          ctx.beginPath();
          ctx.arc(landmark[0], landmark[1], 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  },
  
  drawAll(persons, faces) {
    this.clear();
    if (persons.length > 0) this.persons(persons);
    if (faces.length > 0) this.faces(faces);
  }
};

const Rules = {
  hasDetections(persons, faces, personMinScore, faceMinScore) {
    const validPersons = persons.filter(p => p.score >= personMinScore);
    const validFaces = faces.filter(f => {
      const confidence = f.probability ? f.probability[0] : 1;
      return confidence >= faceMinScore;
    });
    
    return validPersons.length > 0 || validFaces.length > 0;
  },
  
  getDetectionInfo(persons, faces, personMinScore, faceMinScore) {
    const validPersons = persons.filter(p => p.score >= personMinScore)
      .map(p => ({ 
        type: 'person',
        score: p.score, 
        bbox: p.bbox,
        confidence: p.score 
      }));
    
    const validFaces = faces.filter(f => {
      const confidence = f.probability ? f.probability[0] : 1;
      return confidence >= faceMinScore;
    }).map(f => ({
      type: 'face',
      confidence: f.probability ? f.probability[0] : 1,
      bbox: [
        f.topLeft[0],
        f.topLeft[1], 
        f.bottomRight[0] - f.topLeft[0],
        f.bottomRight[1] - f.topLeft[1]
      ],
      landmarks: f.landmarks || null
    }));
    
    return {
      persons: validPersons,
      faces: validFaces,
      totalDetections: validPersons.length + validFaces.length
    };
  }
};

const ImageCapture = {
  // Captura imagem limpa sem boxes (para webhook)
  captureCleanFrame(videoEl) {
    const canvas = els.capture;
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamanho do canvas
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    
    // Desenhar apenas o frame do vídeo (sem detecções)
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    // Converter para base64
    return canvas.toDataURL('image/jpeg', 0.8);
  },

  // Captura imagem com boxes (para visualização)
  captureFrame(videoEl, persons, faces) {
    const canvas = els.capture;
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamanho do canvas
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    
    // Desenhar frame do vídeo
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    // Desenhar detecções sobre a imagem
    this.drawDetectionsOnCapture(ctx, persons, faces, canvas.width, canvas.height);
    
    // Converter para base64
    return canvas.toDataURL('image/jpeg', 0.8);
  },
  
  drawDetectionsOnCapture(ctx, persons, faces, width, height) {
    // Calcular escala
    const scaleX = width / els.video.clientWidth;
    const scaleY = height / els.video.clientHeight;
    
    ctx.lineWidth = 4;
    ctx.font = '24px Arial, sans-serif';
    
    // Desenhar pessoas
    persons.forEach((person, index) => {
      const [x, y, w, h] = person.bbox.map((coord, i) => 
        i % 2 === 0 ? coord * scaleX : coord * scaleY
      );
      
      ctx.strokeStyle = '#00ff88';
      ctx.fillStyle = 'rgba(0,255,136,0.2)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      
      const label = `PESSOA ${(person.score * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width + 16;
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(x, y - 35, textWidth, 35);
      ctx.fillStyle = '#00ff88';
      ctx.fillText(label, x + 8, y - 8);
    });
    
    // Desenhar faces
    faces.forEach((face, index) => {
      const x = face.topLeft[0] * scaleX;
      const y = face.topLeft[1] * scaleY;
      const w = (face.bottomRight[0] - face.topLeft[0]) * scaleX;
      const h = (face.bottomRight[1] - face.topLeft[1]) * scaleY;
      
      ctx.strokeStyle = '#ff6b6b';
      ctx.fillStyle = 'rgba(255,107,107,0.2)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      
      const confidence = face.probability ? face.probability[0] : 1;
      const label = `ROSTO ${(confidence * 100).toFixed(0)}%`;
      const textWidth = ctx.measureText(label).width + 16;
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(x, y - 35, textWidth, 35);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillText(label, x + 8, y - 8);
    });
    
    // Adicionar timestamp
    const timestamp = new Date().toLocaleString('pt-BR');
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(width - 250, height - 40, 240, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText(timestamp, width - 240, height - 12);
  }
};

const Notifier = {
  async send(url, payload) {
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('Webhook URL inválida');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return { ok: res.ok, status: res.status };
  },

  async sendSecurityAlert(detectionInfo, imageBase64 = null) {
    const payload = {
      event: 'security_detection',
      timestamp: new Date().toISOString(),
      camera_id: 'webcam_001',
      location: 'Entrada Principal',
      detection_summary: {
        total_persons: detectionInfo.persons.length,
        total_faces: detectionInfo.faces.length,
        total_detections: detectionInfo.totalDetections
      },
      detections: {
        persons: detectionInfo.persons.map(p => ({
          confidence: Number(p.confidence.toFixed(3)),
          bbox: p.bbox,
          type: 'person'
        })),
        faces: detectionInfo.faces.map(f => ({
          confidence: Number(f.confidence.toFixed(3)),
          bbox: f.bbox,
          type: 'face',
          has_landmarks: !!f.landmarks
        }))
      },
      image: imageBase64 ? {
        format: 'jpeg',
        data: imageBase64,
        size: Math.round(imageBase64.length * 0.75) // estimativa do tamanho
      } : null,
      metadata: {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timestamp_local: new Date().toLocaleString('pt-BR')
      }
    };

    const url = els.webhookUrl.value.trim();
    return await this.send(url, payload);
  }
};

async function loop() {
  if (!state.running) return;
  
  try {
    // Verificar se a câmera ainda está ativa
    if (!Camera.isActive()) {
      PoliceUI.addLogEntry('cam lost', 'error');
      PoliceUI.updateCameraStatus('error');
      return;
    }
    
    // Verificar se os modelos estão carregados
    if (!state.personModel || !state.faceModel) {
      PoliceUI.addLogEntry('reloading models...', 'warning');
      await Detector.loadAll();
    }
    
    // Detectar pessoas e faces
    const { persons, faces } = await Detector.detectAll(els.video);
    
    const personMinScore = parseFloat(els.confidence.value) || 0.6;
    const faceMinScore = parseFloat(els.faceConfidence.value) || 0.7;
    const draw = els.drawBoxes.checked;
    const captureEnabled = els.captureEnabled.checked;
    
    // Filtrar detecções por confidence
    const validPersons = persons.filter(p => p.score >= personMinScore);
    const validFaces = faces.filter(f => {
      const confidence = f.probability ? f.probability[0] : 1;
      return confidence >= faceMinScore;
    });
    
    // Atualizar estatísticas na interface
    PoliceUI.updateDetectionStats(validPersons.length, validFaces.length);
    
    // Desenhar detecções
    if (draw) {
      Drawer.drawAll(validPersons, validFaces);
    } else {
      Drawer.clear();
    }
    
    // Verificar cooldown
    const now = Date.now();
    const cooldownMs = (parseInt(els.cooldown.value, 10) || 0) * 1000;
    const canSend = now - state.lastSendAt >= cooldownMs;
    
    // Controle de 1 alerta por rosto detectado - APENAS FACES
    const hasFaces = validFaces.length > 0;
    const shouldSendAlert = hasFaces && !state.faceAlertSent && canSend;
    
    // Preparar dados de detecção apenas se necessário
    const detectionInfo = shouldSendAlert ? Rules.getDetectionInfo(persons, faces, personMinScore, faceMinScore) : null;
    
    if (shouldSendAlert) {
      try {
        let imageBase64 = null;
        
        // Capturar imagem limpa se habilitado (sem boxes para webhook)
        if (captureEnabled) {
          imageBase64 = ImageCapture.captureCleanFrame(els.video);
        }
        
        // Enviar webhook
        const resp = await Notifier.sendSecurityAlert(detectionInfo, imageBase64);
        state.lastSendAt = Date.now();
        state.faceAlertSent = true; // Marcar que já foi enviado
        
        const imageInfo = imageBase64 ? '+img' : '';
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        els.lastSend.textContent = `${timestamp} (${resp.status})${imageInfo}`;
        
        PoliceUI.addLogEntry(`FACE ALERT sent (${resp.status})`, 'detection');
        
        // Salvar no histórico
        state.detectionHistory.unshift({
          timestamp: new Date().toISOString(),
          detections: detectionInfo.totalDetections,
          persons: detectionInfo.persons.length,
          faces: detectionInfo.faces.length,
          sent: true,
          status: resp.status
        });
        
        // Manter apenas últimos 10 registros
        if (state.detectionHistory.length > 10) {
          state.detectionHistory = state.detectionHistory.slice(0, 10);
        }
        
      } catch (e) {
        PoliceUI.addLogEntry(`webhook failed: ${e.message}`, 'error');
      }
    }
    
    // Reset alert flag quando não há mais faces
    if (!hasFaces) {
      state.faceAlertSent = false;
    }
    
    // Atualizar estado
    state.lastPersonPresent = validPersons.length > 0;
    state.lastFacePresent = validFaces.length > 0;
    
  } catch (err) {
    PoliceUI.addLogEntry(`detection error: ${err.message}`, 'error');
  } finally {
    if (state.running) {
      // Controle de FPS baseado na configuração
      const fps = parseInt(els.performance.value) || 5;
      const delay = 1000 / fps; // Converter FPS para milissegundos
      setTimeout(() => {
        if (state.running) {
          state.rafId = requestAnimationFrame(loop);
        }
      }, delay);
    }
  }
}

// Event Listeners
els.btnStart.addEventListener('click', async () => {
  if (state.running) return;
  try {
    els.btnStart.disabled = true;
    els.btnStop.disabled = false;
    
    PoliceUI.addLogEntry('init system...', 'info');
    
    // Carregar modelos se necessário
    if (!state.personModel || !state.faceModel) {
      await Detector.loadAll();
    }
    
    // Iniciar câmera
    const cameraInfo = await Camera.start(els.video);
    
    // Verificar se a câmera está realmente funcionando
    if (!Camera.isActive()) {
      throw new Error('Camera init failed');
    }
    
    // Ativar sistema
    state.running = true;
    state.systemStartTime = Date.now();
    state.faceAlertSent = false; // Reset alert flag
    
    PoliceUI.updateSystemStatus('active', true);
    PoliceUI.addLogEntry('SYSTEM ACTIVE', 'success');
    
    // Aguardar um pouco antes de iniciar o loop de detecção
    setTimeout(() => {
      if (state.running) {
        state.rafId = requestAnimationFrame(loop);
        PoliceUI.addLogEntry('AI detection started', 'success');
      }
    }, 1000);
    
  } catch (e) {
    els.btnStart.disabled = false;
    els.btnStop.disabled = true;
    PoliceUI.updateCameraStatus('error');
    PoliceUI.updateSystemStatus('error', false);
    PoliceUI.addLogEntry(`init failed: ${e.message}`, 'error');
  }
});

els.btnStop.addEventListener('click', () => {
  if (!state.running) return;
  
  state.running = false;
  if (state.rafId) cancelAnimationFrame(state.rafId);
  Camera.stop();
  Drawer.clear();
  
  // Reset UI
  PoliceUI.updateSystemStatus('inactive', false);
  PoliceUI.updateDetectionStats(0, 0);
  els.lastSend.textContent = 'Nenhum';
  
  els.btnStart.disabled = false;
  els.btnStop.disabled = true;
  
  PoliceUI.addLogEntry('SYSTEM STOPPED', 'warning');
});

els.btnTest.addEventListener('click', async () => {
  try {
    const url = els.webhookUrl.value.trim();
    let imageBase64 = null;
    
    // Capturar imagem limpa para teste se câmera estiver ativa
    if (Camera.isActive()) {
      imageBase64 = ImageCapture.captureCleanFrame(els.video);
    }
    
    const payload = { 
      event: 'test_ping', 
      timestamp: new Date().toISOString(),
      camera_id: 'webcam_001',
      message: 'Teste de conectividade do sistema policial',
      image_base64: imageBase64
    };
    
    const resp = await Notifier.send(url, payload);
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const imageInfo = imageBase64 ? '+img' : '';
    els.lastSend.textContent = `${timestamp} (test:${resp.status})${imageInfo}`;
    PoliceUI.addLogEntry(`test ok (${resp.status})${imageInfo}`, 'info');
    
  } catch (e) {
    PoliceUI.addLogEntry(`test failed: ${e.message}`, 'error');
  }
});

els.btnCapture.addEventListener('click', async () => {
  // Verificar se a câmera está ativa usando a nova função
  if (!Camera.isActive()) {
    PoliceUI.addLogEntry('cam not active', 'warning');
    return;
  }
  
  try {
    PoliceUI.addLogEntry('manual capture...', 'info');
    
    // Verificar se os modelos estão carregados
    if (!state.personModel || !state.faceModel) {
      await Detector.loadAll();
    }
    
    // Detectar pessoas e faces para captura manual
    const { persons, faces } = await Detector.detectAll(els.video);
    const personMinScore = parseFloat(els.confidence.value) || 0.6;
    const faceMinScore = parseFloat(els.faceConfidence.value) || 0.7;
    
    const validPersons = persons.filter(p => p.score >= personMinScore);
    const validFaces = faces.filter(f => {
      const confidence = f.probability ? f.probability[0] : 1;
      return confidence >= faceMinScore;
    });
    
    const detectionInfo = Rules.getDetectionInfo(persons, faces, personMinScore, faceMinScore);
    const imageBase64 = ImageCapture.captureCleanFrame(els.video);
    
    const resp = await Notifier.sendSecurityAlert(detectionInfo, imageBase64);
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    els.lastSend.textContent = `${timestamp} (manual:${resp.status})`;
    PoliceUI.addLogEntry(`manual sent (${resp.status})`, 'success');
    
  } catch (e) {
    PoliceUI.addLogEntry(`manual failed: ${e.message}`, 'error');
  }
});

els.btnClearCache.addEventListener('click', async () => {
  if (state.running) {
    PoliceUI.addLogEntry('stop system first', 'warning');
    return;
  }
  
  const confirmed = confirm('Clear AI models cache?\n\nModels will be downloaded again on next start.');
  if (confirmed) {
    await Detector.clearCache();
    state.personModel = null;
    state.faceModel = null;
    PoliceUI.addLogEntry('cache cleared', 'success');
  }
});

els.btnModelInfo.addEventListener('click', async () => {
  const info = await Detector.getModelInfo();
  let message = '🧠 INFORMAÇÕES DOS MODELOS IA\n\n';
  
  message += '👥 MODELO PESSOAS (COCO-SSD):\n';
  if (info.person.cached) {
    message += `   ✅ Cache: Sim\n   � Versão: ${info.person.version}\n   💾 Tamanho: ${info.person.size}KB\n   🕒 Salvo: ${info.person.savedAt}\n\n`;
  } else {
    message += '   ❌ Cache: Não disponível\n\n';
  }
  
  message += '😊 MODELO FACES (BlazeFace):\n';
  if (info.face.cached) {
    message += `   ✅ Cache: Sim\n   📅 Versão: ${info.face.version}\n   💾 Tamanho: ${info.face.size}KB\n   🕒 Salvo: ${info.face.savedAt}\n\n`;
  } else {
    message += '   ❌ Cache: Não disponível\n\n';
  }
  
  // Adicionar estatísticas do sistema
  if (state.systemStartTime) {
    const uptime = Math.floor((Date.now() - state.systemStartTime) / 1000);
    message += `⏱️ TEMPO ATIVO: ${uptime}s\n`;
  }
  
  if (state.detectionHistory.length > 0) {
    message += `📊 HISTÓRICO: ${state.detectionHistory.length} evento(s)\n`;
    message += `🕒 Último: ${new Date(state.detectionHistory[0].timestamp).toLocaleString('pt-BR')}`;
  }
  
  alert(message);
  PoliceUI.addLogEntry('Informações dos modelos IA consultadas', 'info');
});

els.btnForceDownload.addEventListener('click', async () => {
  if (state.running) {
    PoliceUI.addLogEntry('Desative o sistema antes de recarregar modelos', 'warning');
    return;
  }
  
  const confirmed = confirm('⬇️ Confirma recarregamento dos modelos IA?\n\nEsta ação irá substituir o cache atual.');
  if (confirmed) {
    await Detector.clearCache();
    state.personModel = null;
    state.faceModel = null;
    try {
      await Detector.loadAll(true); // forceDownload = true
      PoliceUI.addLogEntry('Modelos IA recarregados com sucesso', 'success');
    } catch (e) {
      PoliceUI.addLogEntry(`Erro ao recarregar modelos: ${e.message}`, 'error');
    }
  }
});

// Controle de visualização das detecções
els.toggleBoxes.addEventListener('click', () => {
  els.drawBoxes.checked = !els.drawBoxes.checked;
  const status = els.drawBoxes.checked ? 'ativadas' : 'desativadas';
  PoliceUI.addLogEntry(`Detecções visuais ${status}`, 'info');
});

// Controle de tela cheia
els.toggleFullscreen.addEventListener('click', () => {
  const videoContainer = document.querySelector('.video-container');
  if (!document.fullscreenElement) {
    videoContainer.requestFullscreen().catch(err => {
      PoliceUI.addLogEntry(`Erro ao ativar tela cheia: ${err.message}`, 'error');
    });
  } else {
    document.exitFullscreen();
  }
});

// Inicialização do sistema
document.addEventListener('DOMContentLoaded', () => {
  PoliceUI.init();
  PoliceUI.addLogEntry('Sistema de Monitoramento Policial inicializado', 'success');
  
  // Debug: verificar se todos os elementos existem
  const missingElements = [];
  Object.keys(els).forEach(key => {
    if (!els[key]) {
      missingElements.push(key);
    }
  });
  
  if (missingElements.length > 0) {
    PoliceUI.addLogEntry(`⚠️ Elementos não encontrados: ${missingElements.join(', ')}`, 'warning');
  } else {
    PoliceUI.addLogEntry('✅ Todos os elementos da interface localizados', 'success');
  }
  
  // Verificar suporte a getUserMedia
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    PoliceUI.addLogEntry('✅ Suporte à câmera detectado', 'success');
  } else {
    PoliceUI.addLogEntry('❌ Navegador não suporta acesso à câmera', 'error');
  }
  
  // Verificar TensorFlow.js
  if (typeof tf !== 'undefined') {
    PoliceUI.addLogEntry('✅ TensorFlow.js carregado', 'success');
  } else {
    PoliceUI.addLogEntry('❌ TensorFlow.js não encontrado', 'error');
  }
});
