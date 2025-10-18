/* Modern Mobile AI Detection App - YouTube Style */

// DOM Elements
const els = {
  // Video
  video: document.getElementById('video'),
  overlay: document.getElementById('overlay'),
  capture: document.getElementById('capture'),
  
  // Overlays
  autoStartOverlay: document.getElementById('autoStartOverlay'),
  cameraPermission: document.getElementById('cameraPermission'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingText: document.getElementById('loadingText'),
  
  // Auto-start
  countdown: document.getElementById('countdown'),
  startNowBtn: document.getElementById('startNowBtn'),
  cancelAutoBtn: document.getElementById('cancelAutoBtn'),
  
  // Camera permission
  allowCameraBtn: document.getElementById('allowCameraBtn'),
  rememberChoice: document.getElementById('rememberChoice'),
  
  // Controls
  toggleBtn: document.getElementById('toggleBtn'),
  captureBtn: document.getElementById('captureBtn'),
  debugBtn: document.getElementById('debugBtn'),
  
  // Menu
  menuBtn: document.getElementById('menuBtn'),
  sideMenu: document.getElementById('sideMenu'),
  closeMenu: document.getElementById('closeMenu'),
  overlay: document.getElementById('overlay'),
  
  // Theme
  themeToggle: document.getElementById('themeToggle'),
  darkModeToggle: document.getElementById('darkModeToggle'),
  
  // Stats
  personCount: document.getElementById('personCount'),
  faceCount: document.getElementById('faceCount'),
  totalDetections: document.getElementById('totalDetections'),
  
  // Settings
  drawBoxes: document.getElementById('drawBoxes'),
  captureEnabled: document.getElementById('captureEnabled'),
  webhookUrl: document.getElementById('webhookUrl'),
  testWebhook: document.getElementById('testWebhook'),
  
  // Range controls
  confidence: document.getElementById('confidence'),
  confidenceValue: document.getElementById('confidenceValue'),
  faceConfidence: document.getElementById('faceConfidence'),
  faceConfidenceValue: document.getElementById('faceConfidenceValue'),
  cooldown: document.getElementById('cooldown'),
  cooldownValue: document.getElementById('cooldownValue'),
  performance: document.getElementById('performance'),
  performanceValue: document.getElementById('performanceValue'),
  captureDelay: document.getElementById('captureDelay'),
  captureDelayValue: document.getElementById('captureDelayValue'),
  
  // Status
  cameraStatus: document.getElementById('cameraStatus'),
  modelStatus: document.getElementById('modelStatus'),
  faceModelStatus: document.getElementById('faceModelStatus'),
  lastSend: document.getElementById('lastSend'),
  webhookStatus: document.getElementById('webhookStatus'),
  
  // Actions
  clearCache: document.getElementById('clearCache'),
  modelInfo: document.getElementById('modelInfo'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// App State
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
  currentDetections: { persons: 0, faces: 0, total: 0 },
  systemStartTime: null,
  lastLogMessages: new Set(),
  faceAlertSent: false,
  autoStartTimer: null,
  cameraPermissionGranted: false,
  
  // Sistema de delay para frente
  pendingCapture: null, // {frameCount: X, detectionInfo: {}, scheduledAt: timestamp}
  currentFrameCount: 0
};

// Theme Management
const Theme = {
  init() {
    // Check saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    
    // Update UI elements
    this.updateThemeUI();
  },

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      els.themeToggle.innerHTML = '☀️';
      els.themeToggle.title = 'Modo claro';
    } else {
      document.documentElement.removeAttribute('data-theme');
      els.themeToggle.innerHTML = '🌙';
      els.themeToggle.title = 'Modo escuro';
    }
    
    // Save preference
    localStorage.setItem('theme', theme);
    
    // Update menu toggle
    if (els.darkModeToggle) {
      els.darkModeToggle.checked = theme === 'dark';
    }
  },

  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    
    // Show toast
    Utils.showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
  },

  updateThemeUI() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (els.darkModeToggle) {
      els.darkModeToggle.checked = isDark;
    }
  }
};

// Utility Functions
const Utils = {
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  updateStatus(element, status, text) {
    element.textContent = text;
    element.setAttribute('data-status', status);
  },

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour12: false });
  },

  saveUserPreference(key, value) {
    localStorage.setItem(`aiDetection_${key}`, JSON.stringify(value));
  },

  getUserPreference(key, defaultValue = null) {
    const stored = localStorage.getItem(`aiDetection_${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  },

  isWebhookConfigured() {
    const url = els.webhookUrl.value.trim();
    return url && /^https?:\/\//i.test(url);
  }
};

// Settings Manager
const Settings = {
  init() {
    this.loadSettings();
    this.setupRangeSliders();
    this.setupEventListeners();
  },

  loadSettings() {
    // Load saved settings
    const savedSettings = {
      webhookUrl: Utils.getUserPreference('webhookUrl', ''),
      confidence: Utils.getUserPreference('confidence', 0.6),
      faceConfidence: Utils.getUserPreference('faceConfidence', 0.7),
      cooldown: Utils.getUserPreference('cooldown', 5),
      performance: Utils.getUserPreference('performance', 5),
      captureDelay: Utils.getUserPreference('captureDelay', 3),
      drawBoxes: Utils.getUserPreference('drawBoxes', true),
      captureEnabled: Utils.getUserPreference('captureEnabled', true),
      cameraPermissionGranted: Utils.getUserPreference('cameraPermissionGranted', false)
    };

    // Apply settings
    els.webhookUrl.value = savedSettings.webhookUrl;
    els.confidence.value = savedSettings.confidence;
    els.faceConfidence.value = savedSettings.faceConfidence;
    els.cooldown.value = savedSettings.cooldown;
    els.performance.value = savedSettings.performance;
    els.captureDelay.value = savedSettings.captureDelay;
    els.drawBoxes.checked = savedSettings.drawBoxes;
    els.captureEnabled.checked = savedSettings.captureEnabled;
    state.cameraPermissionGranted = savedSettings.cameraPermissionGranted;

    // Update range displays
    this.updateRangeDisplays();
    this.updateWebhookStatus();
  },

  setupRangeSliders() {
    els.confidence.addEventListener('input', (e) => {
      const value = Math.round(e.target.value * 100);
      els.confidenceValue.textContent = `${value}%`;
      Utils.saveUserPreference('confidence', parseFloat(e.target.value));
    });

    els.faceConfidence.addEventListener('input', (e) => {
      const value = Math.round(e.target.value * 100);
      els.faceConfidenceValue.textContent = `${value}%`;
      Utils.saveUserPreference('faceConfidence', parseFloat(e.target.value));
    });

    els.cooldown.addEventListener('input', (e) => {
      els.cooldownValue.textContent = `${e.target.value}s`;
      Utils.saveUserPreference('cooldown', parseInt(e.target.value));
    });

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
      Utils.saveUserPreference('performance', fps);
    });

    els.captureDelay.addEventListener('input', (e) => {
      const frames = parseInt(e.target.value);
      const fps = parseInt(els.performance.value) || 5;
      const timeMs = Math.round((frames / fps) * 1000);
      
      let label = '';
      if (frames === 0) label = 'Imediato';
      else if (frames <= 2) label = 'Rápido';
      else if (frames <= 4) label = 'Médio';
      else label = 'Lento';
      
      els.captureDelayValue.textContent = `${frames} frames (~${timeMs}ms) - ${label}`;
      Utils.saveUserPreference('captureDelay', frames);
    });
  },

  updateRangeDisplays() {
    els.confidenceValue.textContent = `${Math.round(els.confidence.value * 100)}%`;
    els.faceConfidenceValue.textContent = `${Math.round(els.faceConfidence.value * 100)}%`;
    els.cooldownValue.textContent = `${els.cooldown.value}s`;
    
    const fps = parseInt(els.performance.value);
    let label = '';
    if (fps <= 3) label = 'Ultra Low';
    else if (fps <= 5) label = 'Mobile';
    else if (fps <= 10) label = 'Low';
    else if (fps <= 15) label = 'Medium';
    else if (fps <= 20) label = 'High';
    else label = 'Ultra';
    els.performanceValue.textContent = `${fps} FPS (${label})`;
    
    // Atualiza display do delay de captura
    const frames = parseInt(els.captureDelay.value);
    const timeMs = Math.round((frames / fps) * 1000);
    let delayLabel = '';
    if (frames === 0) delayLabel = 'Imediato';
    else if (frames <= 2) delayLabel = 'Rápido';
    else if (frames <= 4) delayLabel = 'Médio';
    else delayLabel = 'Lento';
    els.captureDelayValue.textContent = `${frames} frames (~${timeMs}ms) - ${delayLabel}`;
  },

  setupEventListeners() {
    els.webhookUrl.addEventListener('input', (e) => {
      Utils.saveUserPreference('webhookUrl', e.target.value);
      this.updateWebhookStatus();
    });

    els.drawBoxes.addEventListener('change', (e) => {
      Utils.saveUserPreference('drawBoxes', e.target.checked);
    });

    els.captureEnabled.addEventListener('change', (e) => {
      Utils.saveUserPreference('captureEnabled', e.target.checked);
    });
  },

  updateWebhookStatus() {
    const url = els.webhookUrl.value.trim();
    if (!url) {
      els.webhookStatus.textContent = 'Não configurado';
    } else if (!/^https?:\/\//i.test(url)) {
      els.webhookStatus.textContent = 'URL inválida';
    } else {
      els.webhookStatus.textContent = 'Configurado';
    }
  }
};

// Auto Start System
const AutoStart = {
  init() {
    // Check if user previously granted permission
    if (state.cameraPermissionGranted) {
      this.startCountdown();
    } else {
      this.showCameraPermission();
    }
  },

  startCountdown() {
    els.autoStartOverlay.style.display = 'flex';
    let count = 5;
    
    const updateCountdown = () => {
      els.countdown.textContent = count;
      if (count <= 0) {
        this.autoActivate();
      } else {
        count--;
        state.autoStartTimer = setTimeout(updateCountdown, 1000);
      }
    };

    updateCountdown();
  },

  cancelCountdown() {
    if (state.autoStartTimer) {
      clearTimeout(state.autoStartTimer);
      state.autoStartTimer = null;
    }
    els.autoStartOverlay.style.display = 'none';
    this.showCameraPermission();
  },

  async autoActivate() {
    els.autoStartOverlay.style.display = 'none';
    await App.start();
  },

  showCameraPermission() {
    els.cameraPermission.style.display = 'flex';
  },

  hideCameraPermission() {
    els.cameraPermission.style.display = 'none';
  },

  async grantPermission() {
    const remember = els.rememberChoice.checked;
    if (remember) {
      Utils.saveUserPreference('cameraPermissionGranted', true);
      state.cameraPermissionGranted = true;
    }
    this.hideCameraPermission();
    await App.start();
  }
};

// Camera Manager
const Camera = {
  async start(videoEl) {
    try {
      Utils.updateStatus(els.cameraStatus, 'loading', 'Conectando...');
      
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      
      state.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = state.stream;
      
      return new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = () => {
          const videoWidth = videoEl.videoWidth;
          const videoHeight = videoEl.videoHeight;
          Utils.updateStatus(els.cameraStatus, 'online', 'Conectada');
          Utils.showToast(`Câmera: ${videoWidth}x${videoHeight}`, 'success');
          resolve({ videoWidth, videoHeight });
        };
        videoEl.onerror = reject;
      });
    } catch (error) {
      Utils.updateStatus(els.cameraStatus, 'offline', 'Erro');
      Utils.showToast(`Erro na câmera: ${error.message}`, 'error');
      throw error;
    }
  },

  stop() {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      state.stream = null;
      Utils.updateStatus(els.cameraStatus, 'offline', 'Desconectada');
    }
  },

  isActive() {
    return state.stream && els.video.readyState >= 2 && 
           els.video.videoWidth > 0 && els.video.videoHeight > 0;
  }
};

// Model Cache System
const ModelCache = {
  async saveToCache(modelType, modelInfo) {
    try {
      const cacheData = {
        version: '1.0',
        modelInfo,
        savedAt: new Date().toISOString(),
        size: modelInfo.size || 0
      };
      localStorage.setItem(`aiModel_${modelType}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save model to cache:', error);
    }
  },

  async loadFromCache(modelType) {
    try {
      const cached = localStorage.getItem(`aiModel_${modelType}`);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      if (cacheData.version === '1.0') {
        return cacheData;
      }
      return null;
    } catch (error) {
      console.warn('Failed to load model from cache:', error);
      return null;
    }
  },

  async clearCache() {
    try {
      localStorage.removeItem('aiModel_person');
      localStorage.removeItem('aiModel_face');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
};

// AI Detection Models
const Detector = {
  async loadPersonModel(forceDownload = false) {
    try {
      let cachedData = null;
      
      if (!forceDownload) {
        Utils.updateStatus(els.modelStatus, 'loading', 'Verificando...');
        cachedData = await ModelCache.loadFromCache('person');
        
        if (cachedData) {
          Utils.updateStatus(els.modelStatus, 'online', 'Cache');
        }
      }
      
      if (!cachedData || forceDownload) {
        Utils.updateStatus(els.modelStatus, 'loading', 'Baixando...');
        els.loadingText.textContent = 'Carregando modelo de pessoas...';
      }
      
      state.personModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      
      if (!cachedData || forceDownload) {
        const modelInfo = {
          modelType: 'coco-ssd',
          base: 'lite_mobilenet_v2',
          downloadedAt: Date.now(),
          size: 5000 // Approx 5MB
        };
        await ModelCache.saveToCache('person', modelInfo);
      }
      
      Utils.updateStatus(els.modelStatus, 'online', 'Pronto');
      
    } catch (error) {
      Utils.updateStatus(els.modelStatus, 'offline', 'Erro');
      throw error;
    }
  },

  async loadFaceModel(forceDownload = false) {
    try {
      let cachedData = null;
      
      if (!forceDownload) {
        Utils.updateStatus(els.faceModelStatus, 'loading', 'Verificando...');
        cachedData = await ModelCache.loadFromCache('face');
        
        if (cachedData) {
          Utils.updateStatus(els.faceModelStatus, 'online', 'Cache');
        }
      }
      
      if (!cachedData || forceDownload) {
        Utils.updateStatus(els.faceModelStatus, 'loading', 'Baixando...');
        els.loadingText.textContent = 'Carregando modelo de faces...';
      }
      
      state.faceModel = await blazeface.load();
      
      if (!cachedData || forceDownload) {
        const modelInfo = {
          modelType: 'blazeface',
          downloadedAt: Date.now(),
          size: 1000 // Approx 1MB
        };
        await ModelCache.saveToCache('face', modelInfo);
      }
      
      Utils.updateStatus(els.faceModelStatus, 'online', 'Pronto');
      
    } catch (error) {
      Utils.updateStatus(els.faceModelStatus, 'offline', 'Erro');
      throw error;
    }
  },

  async loadAll(forceDownload = false) {
    await Promise.all([
      this.loadPersonModel(forceDownload),
      this.loadFaceModel(forceDownload)
    ]);
  },

  async detectAll(videoEl) {
    const [persons, faces] = await Promise.all([
      state.personModel.detect(videoEl),
      state.faceModel.estimateFaces(videoEl, false)
    ]);
    return { persons, faces };
  },

  async clearCache() {
    try {
      await ModelCache.clearCache();
      state.personModel = null;
      state.faceModel = null;
      Utils.updateStatus(els.modelStatus, 'offline', 'Cache limpo');
      Utils.updateStatus(els.faceModelStatus, 'offline', 'Cache limpo');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
};

// Detection Rules
const Rules = {
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

// Drawing System
const Drawer = {
  drawAll(persons, faces) {
    const canvas = els.overlay;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = els.video.clientWidth;
    canvas.height = els.video.clientHeight;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate scale
    const scaleX = canvas.width / els.video.videoWidth;
    const scaleY = canvas.height / els.video.videoHeight;
    
    // Draw persons
    ctx.strokeStyle = '#34a853';
    ctx.lineWidth = 2;
    ctx.font = '14px Inter, sans-serif';
    
    persons.forEach(person => {
      const [x, y, w, h] = person.bbox.map((coord, i) => 
        i % 2 === 0 ? coord * scaleX : coord * scaleY
      );
      
      ctx.strokeRect(x, y, w, h);
      
      const label = `Pessoa ${(person.score * 100).toFixed(0)}%`;
      ctx.fillStyle = 'rgba(52, 168, 83, 0.8)';
      ctx.fillRect(x, y - 20, ctx.measureText(label).width + 8, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 4, y - 6);
    });
    
    // Draw faces
    ctx.strokeStyle = '#1a73e8';
    
    faces.forEach(face => {
      const x = face.topLeft[0] * scaleX;
      const y = face.topLeft[1] * scaleY;
      const w = (face.bottomRight[0] - face.topLeft[0]) * scaleX;
      const h = (face.bottomRight[1] - face.topLeft[1]) * scaleY;
      
      ctx.strokeRect(x, y, w, h);
      
      const confidence = face.probability ? face.probability[0] : 1;
      const label = `Rosto ${(confidence * 100).toFixed(0)}%`;
      ctx.fillStyle = 'rgba(26, 115, 232, 0.8)';
      ctx.fillRect(x, y - 20, ctx.measureText(label).width + 8, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 4, y - 6);
    });
  },

  clear() {
    const canvas = els.overlay;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// Image Capture System
const ImageCapture = {
  captureCleanFrame(videoEl) {
    const canvas = els.capture;
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }
};

// Webhook Notifier
const Notifier = {
  async send(url, payload) {
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('URL inválida');
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
      event: detectionInfo.is_test ? 'test_detection' : 'security_detection',
      is_test: detectionInfo.is_test || false,
      timestamp: new Date().toISOString(),
      camera_id: 'mobile_cam_001',
      location: 'Mobile Device',
      detection_summary: {
        total_persons: detectionInfo.persons.length,
        total_faces: detectionInfo.faces.length,
        total_detections: detectionInfo.totalDetections
      },
      detections: {
        persons: detectionInfo.persons,
        faces: detectionInfo.faces
      },
      image: imageBase64 ? {
        format: 'jpeg',
        data: imageBase64,
        size: Math.round(imageBase64.length * 0.75)
      } : null,
      metadata: {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        timestamp_local: new Date().toLocaleString('pt-BR'),
        test_mode: detectionInfo.is_test || false
      }
    };

    const url = els.webhookUrl.value.trim();
    return await this.send(url, payload);
  }
};

// Main Detection Loop
async function loop() {
  if (!state.running) return;
  
  try {
    if (!Camera.isActive()) {
      Utils.showToast('Câmera perdeu conexão', 'error');
      Utils.updateStatus(els.cameraStatus, 'offline', 'Erro');
      return;
    }
    
    if (!state.personModel || !state.faceModel) {
      await Detector.loadAll();
    }
    
    const { persons, faces } = await Detector.detectAll(els.video);
    
    const personMinScore = parseFloat(els.confidence.value) || 0.6;
    const faceMinScore = parseFloat(els.faceConfidence.value) || 0.7;
    const draw = els.drawBoxes.checked;
    const captureEnabled = els.captureEnabled.checked;
    
    const validPersons = persons.filter(p => p.score >= personMinScore);
    const validFaces = faces.filter(f => {
      const confidence = f.probability ? f.probability[0] : 1;
      return confidence >= faceMinScore;
    });
    
    // Update stats
    els.personCount.textContent = validPersons.length;
    els.faceCount.textContent = validFaces.length;
    els.totalDetections.textContent = validPersons.length + validFaces.length;
    
    // Draw detections
    if (draw) {
      Drawer.drawAll(validPersons, validFaces);
    } else {
      Drawer.clear();
    }
    
    // Webhook logic - APENAS para faces detectadas E webhook configurado
    const hasFaces = validFaces.length > 0;
    const hasValidWebhook = Utils.isWebhookConfigured();
    const now = Date.now();
    const cooldownMs = (parseInt(els.cooldown.value, 10) || 0) * 1000;
    const canSend = now - state.lastSendAt >= cooldownMs;
    
    // Incrementa contador de frames
    state.currentFrameCount++;
    
    // 🎯 NOVA LÓGICA: Sistema de delay para FRENTE
    const shouldScheduleCapture = hasFaces && hasValidWebhook && !state.faceAlertSent && canSend && !state.pendingCapture;
    
    if (shouldScheduleCapture) {
      // Detectou rosto - AGENDA captura para N frames no futuro
      const delayFrames = parseInt(els.captureDelay.value) || 3;
      const detectionInfo = Rules.getDetectionInfo(persons, faces, personMinScore, faceMinScore);
      
      if (delayFrames === 0) {
        // Captura imediata (sem delay)
        try {
          let imageBase64 = null;
          if (captureEnabled) {
            imageBase64 = ImageCapture.captureCleanFrame(els.video);
          }
          
          const resp = await Notifier.sendSecurityAlert(detectionInfo, imageBase64);
          state.lastSendAt = Date.now();
          state.faceAlertSent = true;
          
          const timestamp = Utils.formatTime(Date.now());
          els.lastSend.textContent = `${timestamp} (${resp.status})`;
          Utils.showToast(`Alerta enviado imediato (${resp.status})`, 'success');
        } catch (e) {
          Utils.showToast(`Erro no webhook: ${e.message}`, 'error');
        }
      } else {
        // Agenda captura para o futuro
        state.pendingCapture = {
          frameCount: state.currentFrameCount + delayFrames,
          detectionInfo: detectionInfo,
          scheduledAt: Date.now(),
          captureEnabled: captureEnabled
        };
        
        state.faceAlertSent = true; // Marca como enviado para não reagendar 
      }
    }
    
    // Verifica se chegou a hora de executar captura agendada
    if (state.pendingCapture && state.currentFrameCount >= state.pendingCapture.frameCount) {
      try {
        let imageBase64 = null;
        if (state.pendingCapture.captureEnabled) {
          imageBase64 = ImageCapture.captureCleanFrame(els.video);
        }
        
        const resp = await Notifier.sendSecurityAlert(state.pendingCapture.detectionInfo, imageBase64);
        state.lastSendAt = Date.now();
        
        const timestamp = Utils.formatTime(Date.now());
        els.lastSend.textContent = `${timestamp} (${resp.status})`;
        Utils.showToast(`📸 Captura executada (${resp.status})`, 'success');
        
      } catch (e) {
        Utils.showToast(`Erro no webhook: ${e.message}`, 'error');
      } finally {
        // Limpa captura agendada
        state.pendingCapture = null;
      }
    }
    
    // Reset alert flag when no faces
    if (!hasFaces) {
      state.faceAlertSent = false;
      // Cancela captura pendente se não há mais faces
      if (state.pendingCapture) {
        state.pendingCapture = null;
        Utils.showToast('❌ Captura cancelada - sem faces', 'warning');
      }
    }
    
    state.lastPersonPresent = validPersons.length > 0;
    state.lastFacePresent = validFaces.length > 0;
    
  } catch (err) {
    Utils.showToast(`Erro na detecção: ${err.message}`, 'error');
  } finally {
    if (state.running) {
      const fps = parseInt(els.performance.value) || 5;
      const delay = 1000 / fps;
      setTimeout(() => {
        if (state.running) {
          state.rafId = requestAnimationFrame(loop);
        }
      }, delay);
    }
  }
}

// Main App Controller
const App = {
  async start() {
    if (state.running) {
      console.log('App.start() called but already running');
      return;
    }
    
    console.log('App.start() called, starting system...');
    
    try {
      els.loadingOverlay.style.display = 'flex';
      els.toggleBtn.disabled = true;
      
      // Load AI models
      if (!state.personModel || !state.faceModel) {
        await Detector.loadAll();
      }
      
      // Start camera
      await Camera.start(els.video);
      
      if (!Camera.isActive()) {
        throw new Error('Falha na inicialização da câmera');
      }
      
      // Start detection
      state.running = true;
      state.systemStartTime = Date.now();
      state.faceAlertSent = false;
      
      // Reset sistema de delay para frente
      state.pendingCapture = null;
      state.currentFrameCount = 0;
      
      els.loadingOverlay.style.display = 'none';
      els.toggleBtn.disabled = false; // Re-enable button
      els.toggleBtn.querySelector('.btn-text').textContent = 'Parar';
      els.captureBtn.disabled = false;
      els.debugBtn.style.display = 'block'; // Show debug button
      
      Utils.showToast('Sistema ativado', 'success');
      
      setTimeout(() => {
        if (state.running) {
          state.rafId = requestAnimationFrame(loop);
        }
      }, 1000);
      
    } catch (e) {
      els.loadingOverlay.style.display = 'none';
      els.toggleBtn.disabled = false;
      Utils.showToast(`Erro: ${e.message}`, 'error');
      Utils.updateStatus(els.cameraStatus, 'offline', 'Erro');
    }
  },

  stop() {
    console.log('App.stop() called, state.running:', state.running);
    
    // Sempre parar, mesmo se state.running for false
    state.running = false;
    
    // Cancelar animation frame
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    
    // Parar câmera
    Camera.stop();
    
    // Limpar desenhos
    Drawer.clear();
    
    // Reset UI
    els.toggleBtn.querySelector('.btn-text').textContent = 'Iniciar';
    els.toggleBtn.disabled = false;
    els.captureBtn.disabled = true;
    els.debugBtn.style.display = 'none'; // Hide debug button
    
    // Reset stats
    els.personCount.textContent = '0';
    els.faceCount.textContent = '0';
    els.totalDetections.textContent = '0';
    
    // Reset alert state e sistema de delay
    state.faceAlertSent = false;
    state.pendingCapture = null;
    state.currentFrameCount = 0;
    
    Utils.showToast('Sistema parado', 'warning');
  },

  async capture() {
    if (!Camera.isActive()) {
      Utils.showToast('Câmera não ativa', 'warning');
      return;
    }

    // Validar webhook URL
    if (!Utils.isWebhookConfigured()) {
      Utils.showToast('Configure uma URL de webhook válida primeiro', 'warning');
      return;
    }
    
    try {
      if (!state.personModel || !state.faceModel) {
        await Detector.loadAll();
      }
      
      const { persons, faces } = await Detector.detectAll(els.video);
      const personMinScore = parseFloat(els.confidence.value) || 0.6;
      const faceMinScore = parseFloat(els.faceConfidence.value) || 0.7;
      
      const detectionInfo = Rules.getDetectionInfo(persons, faces, personMinScore, faceMinScore);
      const imageBase64 = ImageCapture.captureCleanFrame(els.video);
      
      const resp = await Notifier.sendSecurityAlert(detectionInfo, imageBase64);
      const timestamp = Utils.formatTime(Date.now());
      els.lastSend.textContent = `${timestamp} (manual:${resp.status})`;
      
      Utils.showToast(`Captura enviada (${resp.status})`, 'success');
      
    } catch (e) {
      Utils.showToast(`Erro na captura: ${e.message}`, 'error');
    }
  },

  async testWebhook() {
    // Validar webhook URL
    if (!Utils.isWebhookConfigured()) {
      Utils.showToast('Configure uma URL de webhook válida primeiro', 'warning');
      return;
    }

    if (!Camera.isActive()) {
      Utils.showToast('Câmera não ativa - Teste básico será enviado', 'warning');
      
      try {
        const url = els.webhookUrl.value.trim();
        const payload = { 
          event: 'test_ping', 
          timestamp: new Date().toISOString(),
          camera_id: 'mobile_cam_001',
          message: 'Teste de conectividade (sem câmera)',
          image_base64: null
        };
        
        const resp = await Notifier.send(url, payload);
        const timestamp = Utils.formatTime(Date.now());
        els.lastSend.textContent = `${timestamp} (test:${resp.status})`;
        
        Utils.showToast(`Teste OK (${resp.status})`, 'success');
        
      } catch (e) {
        Utils.showToast(`Teste Falhou: ${e.message}`, 'error');
      }
      return;
    }

    try {
      // Usar exatamente a mesma lógica da função capture()
      if (!state.personModel || !state.faceModel) {
        await Detector.loadAll();
      }
      
      const { persons, faces } = await Detector.detectAll(els.video);
      const personMinScore = parseFloat(els.confidence.value) || 0.6;
      const faceMinScore = parseFloat(els.faceConfidence.value) || 0.7;
      
      const detectionInfo = Rules.getDetectionInfo(persons, faces, personMinScore, faceMinScore);
      const imageBase64 = ImageCapture.captureCleanFrame(els.video);
      
      // Enviar usando o mesmo método que a captura, mas marcando como teste
      const resp = await Notifier.sendSecurityAlert({
        ...detectionInfo,
        is_test: true // Adicionar flag de teste
      }, imageBase64);
      
      const timestamp = Utils.formatTime(Date.now());
      els.lastSend.textContent = `${timestamp} (test:${resp.status})`;
      
      const detectionText = `P:${detectionInfo.persons_count}, F:${detectionInfo.faces_count}`;
      Utils.showToast(`Teste OK (${resp.status}) - ${detectionText}`, 'success');
      
    } catch (e) {
      Utils.showToast(`Teste Falhou: ${e.message}`, 'error');
    }
  }
};

// UI Controller
const UI = {
  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Auto-start events
    els.startNowBtn.addEventListener('click', () => {
      if (state.autoStartTimer) {
        clearTimeout(state.autoStartTimer);
      }
      AutoStart.autoActivate();
    });

    els.cancelAutoBtn.addEventListener('click', () => {
      AutoStart.cancelCountdown();
    });

    // Camera permission
    els.allowCameraBtn.addEventListener('click', () => {
      AutoStart.grantPermission();
    });

    // Menu toggle
    els.menuBtn.addEventListener('click', () => {
      els.sideMenu.classList.add('open');
      els.overlay.classList.add('show');
      els.menuBtn.classList.add('active');
    });

    els.closeMenu.addEventListener('click', () => {
      this.closeMenu();
    });

    els.overlay.addEventListener('click', () => {
      this.closeMenu();
    });

    // Theme controls
    els.themeToggle.addEventListener('click', () => {
      Theme.toggle();
    });

    els.darkModeToggle.addEventListener('change', (e) => {
      const newTheme = e.target.checked ? 'dark' : 'light';
      Theme.setTheme(newTheme);
    });

    // Main controls
    els.toggleBtn.addEventListener('click', (e) => {
      console.log('Toggle button clicked, state.running:', state.running);
      console.log('Button disabled:', els.toggleBtn.disabled);
      
      // Prevenir clique se botão estiver desabilitado
      if (els.toggleBtn.disabled) {
        console.log('Button is disabled, ignoring click');
        return;
      }
      
      if (state.running) {
        console.log('Calling App.stop()');
        App.stop();
      } else {
        console.log('Calling App.start()');
        App.start();
      }
    });

    els.captureBtn.addEventListener('click', () => {
      App.capture();
    });

    // Debug button (for testing)
    els.debugBtn.addEventListener('click', () => {
      console.log('Debug button clicked - forcing stop');
      state.running = false;
      if (state.rafId) cancelAnimationFrame(state.rafId);
      Camera.stop();
      Drawer.clear();
      els.toggleBtn.querySelector('.btn-text').textContent = 'Iniciar';
      els.toggleBtn.disabled = false;
      els.captureBtn.disabled = true;
      Utils.showToast('Debug: Sistema forçadamente parado', 'warning');
    });

    // Webhook test
    els.testWebhook.addEventListener('click', () => {
      App.testWebhook();
    });

    // Cache actions
    els.clearCache.addEventListener('click', async () => {
      if (state.running) {
        Utils.showToast('Pare o sistema primeiro', 'warning');
        return;
      }
      
      if (confirm('Limpar cache dos modelos IA?\n\nSerão baixados novamente na próxima inicialização.')) {
        await Detector.clearCache();
        Utils.showToast('Cache limpo', 'success');
      }
    });

    els.modelInfo.addEventListener('click', () => {
      const personStatus = els.modelStatus.textContent;
      const faceStatus = els.faceModelStatus.textContent;
      const cameraStatus = els.cameraStatus.textContent;
      
      alert(`Status dos Modelos IA:\n\n` +
            `Pessoas (COCO-SSD): ${personStatus}\n` +
            `Faces (BlazeFace): ${faceStatus}\n` +
            `Câmera: ${cameraStatus}\n\n` +
            `Cache: localStorage\n` +
            `Versão: 1.0`);
    });
  },

  closeMenu() {
    els.sideMenu.classList.remove('open');
    els.overlay.classList.remove('show');
    els.menuBtn.classList.remove('active');
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  Settings.init();
  UI.init();
  Theme.init();
  
  // Initialize status
  Utils.updateStatus(els.cameraStatus, 'offline', 'Desconectada');
  Utils.updateStatus(els.modelStatus, 'offline', 'Não carregado');
  Utils.updateStatus(els.faceModelStatus, 'offline', 'Não carregado');
  
  // Start auto-activation sequence
  setTimeout(() => {
    AutoStart.init();
  }, 500);
});