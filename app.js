/* Modern Mobile AI Detection App - YouTube Style */

// DOM Elements
const els = {
  // Video
  video: document.getElementById('video'),
  detectionOverlay: document.getElementById('detectionOverlay'),
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
  menuOverlay: document.getElementById('overlay'),
  
  // Theme
  darkModeToggle: document.getElementById('darkModeToggle'),
  
  // Stats
  personCount: document.getElementById('personCount'),
  faceCount: document.getElementById('faceCount'),
  totalDetections: document.getElementById('totalDetections'),
  
  // Settings
  drawBoxes: document.getElementById('drawBoxes'),
  captureEnabled: document.getElementById('captureEnabled'),
  webhookUrl: document.getElementById('webhookUrl'),
  phoneInput: document.getElementById('phoneInput'),
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
  clearToasts: document.getElementById('clearToasts'),
  testToasts: document.getElementById('testToasts'),
  
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
  currentFrameCount: 0,
  
  // Mobile device info
  deviceInfo: null, // { isMobile, isIOS, isAndroid }
  
  // Toast notification system
  toastQueue: [], // Fila de toasts ativos
  lastToastMessage: null // Última mensagem para evitar duplicatas
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
    } else {
      document.documentElement.removeAttribute('data-theme');
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
    
    // Update menu toggle
    if (els.darkModeToggle) {
      els.darkModeToggle.checked = isDark;
    }
  }
};

// Mobile Orientation Manager
const MobileManager = {
  init() {
    this.detectDeviceType();
    this.setupOrientationHandling();
    this.optimizeForMobile();
  },

  detectDeviceType() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    document.body.classList.toggle('mobile-device', isMobile);
    document.body.classList.toggle('ios-device', isIOS);
    document.body.classList.toggle('android-device', isAndroid);
    
    // Salvar informações no estado
    state.deviceInfo = { isMobile, isIOS, isAndroid };
  },

  setupOrientationHandling() {
    // Listener para mudanças de orientação
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Listener para redimensionamento
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    // Configuração inicial
    this.handleOrientationChange();
  },

  handleOrientationChange() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const orientation = screen.orientation?.type || (isPortrait ? 'portrait-primary' : 'landscape-primary');
    
    document.body.classList.toggle('portrait', isPortrait);
    document.body.classList.toggle('landscape', !isPortrait);
    
    // Ajustar câmera se ativa
    if (Camera.isActive()) {
      setTimeout(() => {
        this.adjustVideoForOrientation();
      }, 300);
    }

    // Toast informativo para mudança de orientação
    if (state.deviceInfo?.isMobile) {
      const message = isPortrait ? '📱 Modo Vertical' : '📱 Modo Horizontal';
      Utils.showToast(message, 'info');
    }
  },

  handleResize() {
    // Redimensionar canvas de detecção
    if (els.detectionOverlay && Camera.isActive()) {
      setTimeout(() => {
        const canvas = els.detectionOverlay;
        if (canvas && els.video) {
          canvas.width = els.video.clientWidth;
          canvas.height = els.video.clientHeight;
        }
      }, 100);
    }
  },

  adjustVideoForOrientation() {
    if (!els.video || !Camera.isActive()) return;
    
    const isPortrait = window.innerHeight > window.innerWidth;
    
    // Ajustar configurações da câmera para orientação
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
      if (isPortrait) {
        videoContainer.style.aspectRatio = '16/9';
      } else {
        videoContainer.style.aspectRatio = '16/10';
      }
    }
  },

  optimizeForMobile() {
    if (!state.deviceInfo?.isMobile) return;

    // Prevenir zoom em inputs
    const inputs = document.querySelectorAll('input[type="tel"], input[type="url"], input[type="text"]');
    inputs.forEach(input => {
      input.style.fontSize = '16px'; // Previne zoom no iOS
    });

    // Otimizar performance em mobile
    if (els.performance) {
      // Sugerir FPS mais baixo em mobile
      const currentFPS = parseInt(els.performance.value) || 5;
      if (currentFPS > 10) {
        els.performance.value = '5';
        Utils.saveUserPreference('performance', 5);
        Utils.showToast('⚡ FPS otimizado para mobile', 'info');
      }
    }

    // Adicionar classe CSS para otimizações específicas
    document.body.classList.add('mobile-optimized');
  },

  // Função para forçar orientação portrait (apenas sugestão visual)
  suggestPortraitMode() {
    if (window.innerWidth > window.innerHeight) {
      Utils.showToast('📱 Para melhor experiência, use o modo vertical', 'warning');
    }
  }
};

// Utility Functions
const Utils = {
  showToast(message, type = 'info', duration = 3000) {
    // Verificar se a última mensagem é igual (evitar duplicatas)
    if (state.lastToastMessage === message) {
      console.log('Toast duplicado ignorado:', message);
      return;
    }
    
    // Atualizar última mensagem
    state.lastToastMessage = message;
    
    // Limpar mensagem após um tempo para permitir nova exibição
    setTimeout(() => {
      if (state.lastToastMessage === message) {
        state.lastToastMessage = null;
      }
    }, 1000);
    
    // Verificar limite máximo de toasts (6)
    if (state.toastQueue.length >= 6) {
      // Remover toasts mais antigos
      const oldestToasts = state.toastQueue.splice(0, state.toastQueue.length - 5);
      oldestToasts.forEach(toast => {
        if (toast.element && toast.element.parentNode) {
          toast.element.classList.remove('show');
          setTimeout(() => {
            if (toast.element.parentNode) {
              toast.element.remove();
            }
          }, 300);
        }
      });
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <span class="toast-counter">${state.toastQueue.length + 1}</span>
    `;
    
    // Criar objeto de controle do toast
    const toastControl = {
      element: toast,
      message: message,
      type: type,
      createdAt: Date.now(),
      timeoutId: null
    };
    
    // Adicionar à fila
    state.toastQueue.push(toastControl);
    
    // Adicionar ao DOM
    if (els.toastContainer) {
      els.toastContainer.appendChild(toast);
    } else {
      console.warn('Toast container não encontrado');
      return;
    }
    
    // Animação de entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Programar remoção
    toastControl.timeoutId = setTimeout(() => {
      this.removeToast(toastControl);
    }, duration);
    
    // Adicionar listener para remoção manual (clique)
    toast.addEventListener('click', () => {
      this.removeToast(toastControl);
    });
    
    console.log(`Toast criado: "${message}" (${type}), fila: ${state.toastQueue.length}`);
  },
  
  removeToast(toastControl) {
    if (!toastControl || !toastControl.element) return;
    
    // Limpar timeout se existir
    if (toastControl.timeoutId) {
      clearTimeout(toastControl.timeoutId);
    }
    
    // Remover da fila
    const index = state.toastQueue.indexOf(toastControl);
    if (index > -1) {
      state.toastQueue.splice(index, 1);
    }
    
    // Animação de saída
    toastControl.element.classList.remove('show');
    setTimeout(() => {
      if (toastControl.element && toastControl.element.parentNode) {
        toastControl.element.remove();
      }
    }, 300);
    
    console.log(`Toast removido: "${toastControl.message}", fila: ${state.toastQueue.length}`);
  },
  
  clearAllToasts() {
    // Limpar todos os toasts
    const count = state.toastQueue.length;
    state.toastQueue.forEach(toastControl => {
      this.removeToast(toastControl);
    });
    state.toastQueue = [];
    state.lastToastMessage = null;
    console.log(`Todos os toasts foram limpos (${count} notificações)`);
  },
  
  // Função para debug das notificações
  getToastInfo() {
    return {
      queueLength: state.toastQueue.length,
      lastMessage: state.lastToastMessage,
      queue: state.toastQueue.map(t => ({
        message: t.message,
        type: t.type,
        age: Date.now() - t.createdAt
      }))
    };
  }, 

  // Modal para solicitar telefone válido
  async showPhoneModal() {
    const { value: phone } = await Swal.fire({
      title: 'Telefone Necessário',
      input: 'tel',
      inputLabel: 'Digite seu telefone que receberá as notificações',
      inputPlaceholder: '+55 62 91234 5678',
      inputAttributes: {
        autocapitalize: 'off',
        maxlength: 17
      },
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#6b7280',
      inputValidator: (value) => {
        const normalized = Phone.normalize(value);
        if (!Phone.isValidBrazil(normalized)) {
          return 'Por favor, digite um telefone válido no formato brasileiro';
        }
      },
      customClass: {
        popup: 'phone-modal',
        title: 'phone-modal-title',
        htmlContainer: 'phone-modal-content',
        input: 'phone-modal-input'
      }
    });

    if (phone) {
      const normalized = Phone.normalize(phone);
      const formatted = Phone.formatDisplay(normalized);
      
      // Salvar o telefone
      Utils.saveUserPreference('phone', normalized);
      if (els.phoneInput) {
        els.phoneInput.value = formatted;
      }
      
      Utils.showToast(`✅ Telefone salvo: ${formatted}`, 'success');
      Utils.updateButtonStates();
      
      return true;
    }
    
    return false;
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

  updateButtonStates() {
    // Verificar se tem telefone válido
    const savedPhone = this.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneValid = Phone.isValidBrazil(inputPhoneRaw || savedPhone);
    
    // Verificar se câmera está ativa
    const cameraActive = Camera.isActive();
    
    // Verificar se webhook está configurado
    const webhookValid = this.isWebhookConfigured();
    
    // Habilitar botões só se tudo estiver OK
    const enableButtons = phoneValid && cameraActive && webhookValid;
    
    if (els.captureBtn) {
      els.captureBtn.disabled = !enableButtons;
    }
    
    if (els.testWebhook) {
      els.testWebhook.disabled = !enableButtons;
    }
  },

  isWebhookConfigured() {
    let url = els.webhookUrl.value.trim();
    
    // Se campo estiver vazio, usar URL padrão
    if (!url) {
      url = 'https://workflow.blazysoftware.com.br/webhook/pego-no-pulo';
      els.webhookUrl.value = url;
    }
    
    return url && /^https?:\/\//i.test(url);
  }
};

// Phone utilities
const Phone = {
  // Normalize digits only
  normalize(value = '') {
    return (value || '').replace(/\D+/g, '');
  },

  // Expected full mask digits for +55 62 98116 66035 -> country(2)+area(2)+number(11) = 15? We'll accept Brazil pattern: country(2) + DDD(2) + number(9 or 8)
  // We'll validate for: starts with 55 then 2-digit DDD then 8-9 digit number -> total 12 or 13 digits after country? We'll accept 13 (common with 9).
  isValidBrazil(value = '') {
    const digits = this.normalize(value);
    // Accept patterns like 55629811666035 (14?) but user requested exact mask '+55 62 98116 66035' -> we'll require country(55) + DDD(2) + number(11) = 55 + 2 + 11 = 15 digits
    // However common mobile format is: 55 + DDD(2) + 9XXXXXXXX -> 13 digits (55 + 2 + 9 = 12?) To remain strict we'll accept 13 or 14 or 15 digits
    return /^(55)\d{10,13}$/.test(digits);
  },

  // Format into +55 62 98116 66035 style for display (very permissive)
  formatDisplay(value = '') {
    const d = this.normalize(value);
    if (!d) return '';
    // Ensure starts with 55
    let s = d;
    if (!s.startsWith('55')) s = '55' + s;
    // Take next 2 as DDD
    const country = s.slice(0,2);
    const ddd = s.slice(2,4);
    const rest = s.slice(4);
    // Split rest roughly in middle for readability
    const mid = Math.ceil(rest.length/2);
    const part1 = rest.slice(0, mid);
    const part2 = rest.slice(mid);
    return `+${country} ${ddd} ${part1} ${part2}`.trim();
  },

  // phoneWhatsapp: remove "9" se existir
  phoneWhatsapp(digitsOnly) {
    if (!digitsOnly) return '';
    
    // Garantir que começa com 55
    let s = digitsOnly;
    if (!s.startsWith('55')) s = '55' + s;
    
    // Se contém "9", remove a primeira ocorrência
    if (s.includes('9')) {
      s = s.replace('9', '');
    }
    
    return s;
  },

  // Apply mask in real-time: +55 62 98116 66035
  applyMask(value = '') {
    const digits = this.normalize(value);
    if (!digits) return '';
    
    let formatted = '';
    let index = 0;
    
    // +55 (country code)
    if (index < digits.length) formatted += '+';
    if (index < digits.length) formatted += digits[index++] || '';
    if (index < digits.length) formatted += digits[index++] || '';
    
    // Space + 62 (area code)
    if (index < digits.length) formatted += ' ';
    if (index < digits.length) formatted += digits[index++] || '';
    if (index < digits.length) formatted += digits[index++] || '';
    
    // Space + first part of number
    if (index < digits.length) formatted += ' ';
    
    // Add remaining digits with space in middle
    const remaining = digits.slice(index);
    if (remaining.length <= 5) {
      formatted += remaining;
    } else {
      const mid = 5; // Split at 5 characters
      formatted += remaining.slice(0, mid);
      if (remaining.length > mid) {
        formatted += ' ' + remaining.slice(mid);
      }
    }
    
    return formatted;
  },

  // Adjust cursor position after applying mask
  adjustCursorPosition(oldValue, newValue, oldCursor) {
    // Count non-digit characters before cursor in old value
    const oldDigitsBeforeCursor = this.normalize(oldValue.slice(0, oldCursor)).length;
    
    // Find position in new value where we have the same number of digits
    let newCursor = 0;
    let digitsFound = 0;
    
    for (let i = 0; i < newValue.length && digitsFound < oldDigitsBeforeCursor; i++) {
      if (/\d/.test(newValue[i])) {
        digitsFound++;
      }
      newCursor = i + 1;
    }
    
    return Math.min(newCursor, newValue.length);
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
      webhookUrl: Utils.getUserPreference('webhookUrl', 'https://workflow.blazysoftware.com.br/webhook/pego-no-pulo'),
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
    // Phone: attempt to prefill from URL param ?phone=... (digits only) or saved preference
    const urlParams = new URLSearchParams(window.location.search);
    const paramPhone = urlParams.get('phone');
    let prefPhone = Utils.getUserPreference('phone', '');
    // If URL param exists, normalize digits
    if (paramPhone) {
      const norm = Phone.normalize(paramPhone);
      if (Phone.isValidBrazil(norm)) prefPhone = norm;
    }
    // If preference is valid, format and set input, otherwise leave placeholder
    if (prefPhone && Phone.isValidBrazil(prefPhone)) {
      if (els.phoneInput) els.phoneInput.value = Phone.formatDisplay(prefPhone);
      Utils.saveUserPreference('phone', prefPhone);
    } else {
      if (els.phoneInput) els.phoneInput.value = '';
    }
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
    // Save phone on change with real-time mask
    if (els.phoneInput) {
      els.phoneInput.addEventListener('input', (e) => {
        const currentValue = e.target.value || '';
        const cursorPosition = e.target.selectionStart;
        
        // Apply mask in real-time
        const maskedValue = Phone.applyMask(currentValue);
        e.target.value = maskedValue;
        
        // Restore cursor position (adjusted for mask)
        const newCursorPosition = Phone.adjustCursorPosition(currentValue, maskedValue, cursorPosition);
        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
        
        // Save normalized when valid
        const norm = Phone.normalize(maskedValue);
        if (Phone.isValidBrazil(norm)) {
          Utils.saveUserPreference('phone', norm);
        }
        
        // Update button states when phone changes
        Utils.updateButtonStates();
      });
      // Format on blur if valid
      els.phoneInput.addEventListener('blur', (e) => {
        const norm = Phone.normalize(e.target.value || '');
        if (Phone.isValidBrazil(norm)) {
          e.target.value = Phone.formatDisplay(norm);
        }
      });
    }
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
      Utils.updateButtonStates(); // Update buttons when webhook changes
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

// Permission Manager - Sistema robusto para HTTPS
const PermissionManager = {
  async checkCameraPermission() {
    try {
      // Verificar se a API de permissões está disponível
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' });
        console.log('Camera permission status:', result.state);
        return result.state; // 'granted', 'denied', 'prompt'
      }
      
      // Fallback para browsers mais antigos
      return 'unknown';
    } catch (error) {
      console.warn('Permissions API not available:', error);
      return 'unknown';
    }
  },

  async requestCameraAccess() {
    try {
      // Tentar acessar a câmera diretamente
      const constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Se chegou aqui, a permissão foi concedida
      stream.getTracks().forEach(track => track.stop()); // Parar o stream de teste
      return true;
    } catch (error) {
      console.error('Camera access denied:', error);
      return false;
    }
  },

  async checkAndSetPermissionStatus() {
    const permission = await this.checkCameraPermission();
    
    switch (permission) {
      case 'granted':
        state.cameraPermissionGranted = true;
        Utils.saveUserPreference('cameraPermissionGranted', true);
        return 'granted';
        
      case 'denied':
        state.cameraPermissionGranted = false;
        Utils.saveUserPreference('cameraPermissionGranted', false);
        return 'denied';
        
      case 'prompt':
      case 'unknown':
      default:
        // Verificar se há permissão salva anteriormente
        const savedPermission = Utils.getUserPreference('cameraPermissionGranted', false);
        state.cameraPermissionGranted = savedPermission;
        return savedPermission ? 'granted' : 'prompt';
    }
  },

  isHTTPS() {
    return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  },

  showHTTPSWarning() {
    Utils.showToast('⚠️ Para melhor funcionamento da câmera, use HTTPS', 'warning', 5000);
  }
};

// Auto Start System
const AutoStart = {
  async init() {
    // Verificar se está em HTTPS
    if (!PermissionManager.isHTTPS()) {
      PermissionManager.showHTTPSWarning();
    }

    // Verificar status atual da permissão
    const permissionStatus = await PermissionManager.checkAndSetPermissionStatus();
    
    console.log('Permission status:', permissionStatus);
    
    switch (permissionStatus) {
      case 'granted':
        // Permissão já concedida, iniciar countdown automaticamente
        Utils.showToast('📷 Câmera autorizada', 'success');
        setTimeout(() => {
          this.startCountdown();
        }, 1000);
        break;
        
      case 'denied':
        // Permissão negada, mostrar instruções
        this.showPermissionDeniedHelp();
        break;
        
      default:
        // Primeira vez ou status desconhecido, mostrar tela de permissão
        this.showCameraPermission();
        break;
    }
  },

  startCountdown() {
    // Verificar se há telefone válido antes de iniciar countdown
    const savedPhone = Utils.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneToCheck = inputPhoneRaw || savedPhone;
    
    if (!Phone.isValidBrazil(phoneToCheck)) {
      // Mostrar modal para solicitar telefone
      Utils.showPhoneModal().then((success) => {
        if (success) {
          // Telefone válido inserido, iniciar countdown
          this.startCountdown();
        }
      });
      return; // Não inicia o countdown
    }

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
    // Tentar acessar a câmera primeiro
    const hasAccess = await PermissionManager.requestCameraAccess();
    
    if (!hasAccess) {
      Utils.showToast('❌ Acesso à câmera negado', 'error');
      this.showPermissionDeniedHelp();
      return;
    }

    // Salvar permissão se o usuário escolheu lembrar
    const remember = els.rememberChoice.checked;
    if (remember) {
      Utils.saveUserPreference('cameraPermissionGranted', true);
      state.cameraPermissionGranted = true;
    }
    
    this.hideCameraPermission();
    Utils.showToast('✅ Câmera autorizada com sucesso!', 'success');
    await App.start();
  },

  showPermissionDeniedHelp() {
    // Esconder outros overlays
    this.hideCameraPermission();
    els.autoStartOverlay.style.display = 'none';

    // Criar overlay de ajuda
    const helpOverlay = document.createElement('div');
    helpOverlay.className = 'camera-permission';
    helpOverlay.id = 'permissionHelp';
    helpOverlay.innerHTML = `
      <div class="permission-content">
        <div class="permission-icon">🚫</div>
        <h3>Câmera Bloqueada</h3>
        <p>Para usar o sistema de detecção, você precisa autorizar o acesso à câmera.</p>
        <div class="help-steps">
          <p><strong>Como autorizar:</strong></p>
          <ol>
            <li>Clique no ícone de câmera 📷 na barra de endereços</li>
            <li>Selecione "Permitir"</li>
            <li>Recarregue a página</li>
          </ol>
          ${!PermissionManager.isHTTPS() ? '<p><strong>⚠️ Importante:</strong> Use HTTPS para melhor funcionamento</p>' : ''}
        </div>
        <div class="permission-actions">
          <button class="btn-primary" id="retryPermission">Tentar Novamente</button>
          <button class="btn-secondary" id="refreshPage">Recarregar Página</button>
        </div>
      </div>
    `;

    document.body.appendChild(helpOverlay);

    // Event listeners
    document.getElementById('retryPermission').addEventListener('click', async () => {
      document.body.removeChild(helpOverlay);
      await this.init();
    });

    document.getElementById('refreshPage').addEventListener('click', () => {
      location.reload();
    });

    Utils.showToast('🔒 Câmera bloqueada - Verifique as configurações', 'warning', 5000);
  }
};

// Camera Manager
const Camera = {
  async start(videoEl) {
    try {
      Utils.updateStatus(els.cameraStatus, 'loading', 'Conectando...');
      
      // Otimizar configurações para dispositivo
      const isMobile = state.deviceInfo?.isMobile || false;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      let constraints = {
        video: { 
          facingMode: 'user',
          width: { ideal: isMobile ? (isPortrait ? 480 : 640) : 640 },
          height: { ideal: isMobile ? (isPortrait ? 640 : 480) : 480 }
        }
      };
      
      // Configurações específicas para mobile
      if (isMobile) {
        constraints.video = {
          ...constraints.video,
          frameRate: { ideal: 15, max: 30 },
          // Priorizar qualidade vs performance
          width: { ideal: isPortrait ? 360 : 640, max: isPortrait ? 480 : 720 },
          height: { ideal: isPortrait ? 640 : 360, max: isPortrait ? 720 : 480 }
        };
      }
      
      state.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = state.stream;
      
      return new Promise((resolve, reject) => {
        videoEl.onloadedmetadata = () => {
          const videoWidth = videoEl.videoWidth;
          const videoHeight = videoEl.videoHeight;
          Utils.updateStatus(els.cameraStatus, 'online', 'Conectada');
          
          // Sugestão de orientação para mobile
          if (state.deviceInfo?.isMobile && window.innerWidth > window.innerHeight && window.innerWidth < 800) {
            setTimeout(() => {
              MobileManager.suggestPortraitMode();
            }, 1000);
          }
          
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
    try {
      console.log('Drawer.drawAll called with', persons.length, 'persons and', faces.length, 'faces');
      
      const canvas = els.detectionOverlay;
      console.log('Canvas element:', canvas, 'Type:', typeof canvas);
      
      // Verificar se o canvas existe e é válido
      if (!canvas) {
        console.error('Canvas detectionOverlay não encontrado - elemento é null/undefined');
        return;
      }
      
      if (typeof canvas.getContext !== 'function') {
        console.error('Canvas detectionOverlay não é um canvas válido - getContext não é uma função');
        console.log('Canvas tagName:', canvas.tagName, 'NodeName:', canvas.nodeName);
        return;
      }
      
      console.log('Canvas validation passed, getting context...');
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
    
    console.log('Drawing completed successfully');
    } catch (error) {
      console.error('Erro em Drawer.drawAll:', error);
      Utils.showToast(`Erro no desenho: ${error.message}`, 'error');
    }
  },

  clear() {
    const canvas = els.detectionOverlay;
    
    // Verificar se o canvas existe e é válido
    if (!canvas || typeof canvas.getContext !== 'function') {
      console.error('Canvas detectionOverlay não encontrado ou inválido');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
};

// Image Capture System
const ImageCapture = {
  captureCleanFrame(videoEl) {
    const canvas = els.capture;
    
    // Verificar se o canvas existe e é válido
    if (!canvas || typeof canvas.getContext !== 'function') {
      console.error('Canvas capture não encontrado ou inválido');
      return null;
    }
    
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
    // Attach phone info if available and valid
    const savedPhone = Utils.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneDigits = (inputPhoneRaw || savedPhone) || '';
    if (phoneDigits && Phone.isValidBrazil(phoneDigits)) {
      payload.phone = phoneDigits; // e.g. 55629811666035
      payload.phoneWhatsapp = Phone.phoneWhatsapp(phoneDigits);
    }

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
        Utils.showToast(`Captura executada (${resp.status})`, 'success');
        
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
    // Require valid phone before starting camera
    const savedPhone = Utils.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneToCheck = inputPhoneRaw || savedPhone;
    if (!Phone.isValidBrazil(phoneToCheck)) {
      // Mostrar modal para solicitar telefone
      const success = await Utils.showPhoneModal();
      if (!success) {
        return; // Usuário cancelou
      }
      // Tentar novamente com o novo telefone
      return await this.start();
    }
    // ensure saved
    if (Phone.isValidBrazil(phoneToCheck)) Utils.saveUserPreference('phone', Phone.normalize(phoneToCheck));

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
      Utils.updateButtonStates(); // Update capture and test buttons based on conditions
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
    Utils.updateButtonStates(); // Update capture and test buttons (will disable them)
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

    // Validar telefone
    const savedPhone = Utils.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneToCheck = inputPhoneRaw || savedPhone;
    if (!Phone.isValidBrazil(phoneToCheck)) {
      const success = await Utils.showPhoneModal();
      if (!success) {
        return; // Usuário cancelou
      }
      // Tentar novamente com o novo telefone
      return await this.capture();
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
    // Validar telefone
    const savedPhone = Utils.getUserPreference('phone', '');
    const inputPhoneRaw = els.phoneInput ? Phone.normalize(els.phoneInput.value) : '';
    const phoneToCheck = inputPhoneRaw || savedPhone;
    if (!Phone.isValidBrazil(phoneToCheck)) {
      const success = await Utils.showPhoneModal();
      if (!success) {
        return; // Usuário cancelou
      }
      // Tentar novamente com o novo telefone
      return await this.testWebhook();
    }

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
      els.menuOverlay.classList.add('show');
      els.menuBtn.classList.add('active');
    });

    els.closeMenu.addEventListener('click', () => {
      this.closeMenu();
    });

    els.menuOverlay.addEventListener('click', () => {
      this.closeMenu();
    });

    // Theme controls
    if (els.darkModeToggle) {
      els.darkModeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        Theme.setTheme(newTheme);
      });
    }

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

    // Cache actions - Limpar TUDO
    els.clearCache.addEventListener('click', async () => {
      if (state.running) {
        Utils.showToast('Pare o sistema primeiro', 'warning');
        return;
      }
      
      // Modal de confirmação mais detalhado
      const result = await Swal.fire({
        title: '🗑️ Limpar Tudo?',
        html: `
          <div style="text-align: left;">
            <p><strong>Esta ação irá limpar:</strong></p>
            <ul style="margin: 12px 0;">
              <li>🧠 Cache dos modelos IA</li>
              <li>📞 Telefone salvo</li>
              <li>🎨 Configurações de tema</li>
              <li>⚙️ Todas as preferências</li>
              <li>📋 Histórico de detecções</li>
              <li>🔔 Notificações ativas</li>
              <li>📷 Permissões da câmera</li>
            </ul>
            <p><strong>⚠️ Esta ação não pode ser desfeita!</strong></p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, Limpar Tudo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
        customClass: {
          popup: 'clear-cache-modal'
        }
      });

      if (result.isConfirmed) {
        await UI.clearEverything();
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

    // Clear toasts action
    els.clearToasts.addEventListener('click', () => {
      const toastCount = state.toastQueue.length;
      Utils.clearAllToasts();
      Utils.showToast(`${toastCount} notificações removidas`, 'info');
    });

    // Test toasts action (para demonstrar o sistema)
    els.testToasts.addEventListener('click', () => {
      // Teste do sistema de telefone primeiro
      const testPhone = '5562981666035';
      const whatsappPhone = Phone.phoneWhatsapp(testPhone);
      console.log('Teste telefone:');
      console.log('Original:', testPhone);
      console.log('WhatsApp:', whatsappPhone);
      console.log('Esperado: 55628166035');
      
      Utils.showToast(`📞 Tel: ${testPhone} → WhatsApp: ${whatsappPhone}`, 'info', 4000);
      
      // Testes das notificações
      const testMessages = [
        { msg: 'Teste de notificação 1', type: 'info' },
        { msg: 'Sistema funcionando corretamente ✅', type: 'success' },
        { msg: 'Aviso importante para teste ⚠️', type: 'warning' },
        { msg: 'Erro simulado para demonstração ❌', type: 'error' },
        { msg: 'Câmera ativada com sucesso 📷', type: 'success' },
        { msg: 'Esta é a mesma mensagem', type: 'info' },
        { msg: 'Esta é a mesma mensagem', type: 'info' }, // Esta será ignorada (duplicata)
        { msg: 'Notificação adicional', type: 'warning' },
        { msg: 'Sistema de fila funcionando', type: 'success' },
        { msg: 'Máximo 6 notificações', type: 'error' }
      ];
      
      testMessages.forEach((test, index) => {
        setTimeout(() => {
          Utils.showToast(test.msg, test.type);
        }, (index + 1) * 600);
      });
      
      Utils.showToast('Teste iniciado - Telefone + Notificações', 'info');
    });
  },

  closeMenu() {
    els.sideMenu.classList.remove('open');
    els.menuOverlay.classList.remove('show');
    els.menuBtn.classList.remove('active');
  },

  async clearEverything() {
    try {
      Utils.showToast('🧹 Iniciando limpeza completa...', 'info');
      
      // 1. Limpar cache dos modelos IA
      await Detector.clearCache();
      
      // 2. Limpar todas as preferências do usuário
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('aiDetection_') || key.startsWith('aiModel_') || key === 'theme') {
          localStorage.removeItem(key);
        }
      });
      
      // 3. Limpar notificações ativas
      Utils.clearAllToasts();
      
      // 4. Reset do estado da aplicação
      state.stream = null;
      state.personModel = null;
      state.faceModel = null;
      state.running = false;
      state.rafId = null;
      state.lastPersonPresent = false;
      state.lastFacePresent = false;
      state.lastSendAt = 0;
      state.detectionHistory = [];
      state.currentDetections = { persons: 0, faces: 0, total: 0 };
      state.systemStartTime = null;
      state.lastLogMessages = new Set();
      state.faceAlertSent = false;
      state.autoStartTimer = null;
      state.cameraPermissionGranted = false;
      state.pendingCapture = null;
      state.currentFrameCount = 0;
      state.deviceInfo = null;
      state.toastQueue = [];
      state.lastToastMessage = null;
      
      // 5. Reset da interface
      if (els.phoneInput) els.phoneInput.value = '';
      if (els.webhookUrl) els.webhookUrl.value = 'https://workflow.blazysoftware.com.br/webhook/pego-no-pulo';
      if (els.confidence) els.confidence.value = '0.6';
      if (els.faceConfidence) els.faceConfidence.value = '0.7';
      if (els.cooldown) els.cooldown.value = '5';
      if (els.performance) els.performance.value = '5';
      if (els.captureDelay) els.captureDelay.value = '3';
      if (els.drawBoxes) els.drawBoxes.checked = true;
      if (els.captureEnabled) els.captureEnabled.checked = true;
      if (els.darkModeToggle) els.darkModeToggle.checked = false;
      
      // 6. Reset dos status
      Utils.updateStatus(els.cameraStatus, 'offline', 'Desconectada');
      Utils.updateStatus(els.modelStatus, 'offline', 'Não carregado');
      Utils.updateStatus(els.faceModelStatus, 'offline', 'Não carregado');
      els.lastSend.textContent = 'Nunca';
      els.personCount.textContent = '0';
      els.faceCount.textContent = '0';
      els.totalDetections.textContent = '0';
      
      // 7. Reset do tema para padrão
      Theme.setTheme('light');
      
      // 8. Reset dos displays dos ranges
      Settings.updateRangeDisplays();
      Settings.updateWebhookStatus();
      
      // 9. Parar câmera se estiver ativa
      Camera.stop();
      
      // 10. Reset dos overlays
      if (els.autoStartOverlay) els.autoStartOverlay.style.display = 'none';
      if (els.cameraPermission) els.cameraPermission.style.display = 'none';
      if (els.loadingOverlay) els.loadingOverlay.style.display = 'none';
      
      // Limpar help overlay se existir
      const helpOverlay = document.getElementById('permissionHelp');
      if (helpOverlay) {
        helpOverlay.remove();
      }
      
      Utils.showToast('✅ Limpeza completa realizada!', 'success');
      Utils.showToast('🔄 Recarregue a página para reiniciar', 'info', 5000);
      
      // Opcional: Recarregar automaticamente após 3 segundos
      setTimeout(() => {
        Swal.fire({
          title: 'Limpeza Concluída!',
          text: 'A página será recarregada para aplicar todas as mudanças.',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        }).then(() => {
          location.reload();
        });
      }, 2000);
      
    } catch (error) {
      console.error('Erro durante limpeza:', error);
      Utils.showToast(`❌ Erro na limpeza: ${error.message}`, 'error');
    }
  }
};

// DOM Validation
const DOMUtils = {
  validateEssentialElements() {
    const essentialElements = [
      'video', 'detectionOverlay', 'capture', 'toggleBtn', 
      'captureBtn', 'menuBtn', 'sideMenu', 'toastContainer'
    ];
    
    const missing = essentialElements.filter(id => !document.getElementById(id));
    
    if (missing.length > 0) {
      console.error('Elementos DOM essenciais não encontrados:', missing);
      Utils.showToast(`Erro: Elementos DOM ausentes: ${missing.join(', ')}`, 'error');
      return false;
    }
    
    // Verificar se canvas são válidos
    const detectionCanvas = document.getElementById('detectionOverlay');
    const captureCanvas = document.getElementById('capture');
    
    if (detectionCanvas && typeof detectionCanvas.getContext !== 'function') {
      console.error('detectionOverlay não é um canvas válido');
      return false;
    }
    
    if (captureCanvas && typeof captureCanvas.getContext !== 'function') {
      console.error('capture não é um canvas válido');
      return false;
    }
    
    return true;
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing app...');
  
  // Validar elementos essenciais primeiro
  if (!DOMUtils.validateEssentialElements()) {
    console.error('Falha na validação dos elementos DOM');
    return;
  }
  
  console.log('DOM validation passed, continuing initialization...');
  
  Settings.init();
  UI.init();
  Theme.init();
  MobileManager.init();
  
  // Initialize status
  Utils.updateStatus(els.cameraStatus, 'offline', 'Desconectada');
  Utils.updateStatus(els.modelStatus, 'offline', 'Não carregado');
  Utils.updateStatus(els.faceModelStatus, 'offline', 'Não carregado');
  
  // Set initial button states
  Utils.updateButtonStates();
  
  // Configurar badge de segurança
  const securityBadge = document.getElementById('securityBadge');
  if (securityBadge) {
    if (PermissionManager.isHTTPS()) {
      securityBadge.className = 'security-badge secure';
      securityBadge.textContent = '🔒';
      securityBadge.title = 'Conexão segura (HTTPS)';
    } else {
      securityBadge.className = 'security-badge insecure';
      securityBadge.textContent = '⚠️';
      securityBadge.title = 'Conexão insegura (HTTP) - Use HTTPS para melhor funcionamento';
    }
  }

  // Mostrar mensagens de inicialização
  setTimeout(() => {
    Utils.showToast('🚀 Aplicação carregada com sucesso!', 'success');
    setTimeout(() => {
      Utils.showToast('📱 Sistema otimizado para mobile', 'info');
    }, 800);
    setTimeout(() => {
      Utils.showToast('💡 Clique nas notificações para fechá-las', 'info');
    }, 1600);
  }, 200);
  
  // Start auto-activation sequence
  setTimeout(() => {
    AutoStart.init();
  }, 500);
});