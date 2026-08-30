(function (global) {
  // Common Samsung model codes → marketing names
  const SAMSUNG_MODELS = {
    'SM-S928B': 'Samsung Galaxy S24 Ultra',
    'SM-S926B': 'Samsung Galaxy S24+',
    'SM-S921B': 'Samsung Galaxy S24',
    'SM-S918B': 'Samsung Galaxy S23 Ultra',
    'SM-S916B': 'Samsung Galaxy S23+',
    'SM-S911B': 'Samsung Galaxy S23',
    'SM-G998B': 'Samsung Galaxy S21 Ultra',
    'SM-G996B': 'Samsung Galaxy S21+',
    'SM-G991B': 'Samsung Galaxy S21',
    'SM-A546B': 'Samsung Galaxy A54',
    'SM-A536B': 'Samsung Galaxy A53',
    'SM-A346B': 'Samsung Galaxy A34',
    'SM-A146B': 'Samsung Galaxy A14',
    'SM-F946B': 'Samsung Galaxy Z Fold5',
    'SM-F731B': 'Samsung Galaxy Z Flip5',
  };

  // iPhone screen fingerprint → model (CSS pixels @ pixel ratio)
  const IPHONE_SCREENS = {
    '320x568@2': 'iPhone SE / 5 / 5s',
    '375x667@2': 'iPhone 6 / 7 / 8 / SE 2 / SE 3',
    '375x812@3': 'iPhone X / XS / 11 Pro / 12 mini / 13 mini',
    '390x844@3': 'iPhone 12 / 13 / 14',
    '393x852@3': 'iPhone 14 Pro / 15 / 15 Pro',
    '402x874@3': 'iPhone 16 Pro',
    '414x736@3': 'iPhone 6 Plus / 7 Plus / 8 Plus',
    '414x896@2': 'iPhone XR / 11',
    '414x896@3': 'iPhone XS Max / 11 Pro Max',
    '428x926@3': 'iPhone 12 Pro Max / 13 Pro Max / 14 Plus',
    '430x932@3': 'iPhone 14 Pro Max / 15 Plus / 15 Pro Max',
    '440x956@3': 'iPhone 16 Pro Max',
    '768x1024@2': 'iPad Mini / iPad',
    '810x1080@2': 'iPad Air',
    '834x1194@2': 'iPad Pro 11"',
    '1024x1366@2': 'iPad Pro 12.9"',
  };

  function detectOS(ua) {
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows NT/i.test(ua)) return 'Windows';
    if (/Mac OS X ([\d_]+)/.test(ua)) {
      const m = ua.match(/Mac OS X ([\d_]+)/);
      return 'macOS ' + (m ? m[1].replace(/_/g, '.') : '');
    }
    if (/Android ([\d.]+)/.test(ua)) {
      const m = ua.match(/Android ([\d.]+)/);
      return 'Android ' + (m ? m[1] : '');
    }
    if (/iPhone OS ([\d_]+)/.test(ua) || /iPad.*OS ([\d_]+)/.test(ua)) {
      const m = ua.match(/(?:iPhone OS|OS) ([\d_]+)/);
      return 'iOS ' + (m ? m[1].replace(/_/g, '.') : '');
    }
    if (/CrOS/.test(ua)) return 'ChromeOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown OS';
  }

  function detectBrowser(ua) {
    if (/Edg\/([\d.]+)/.test(ua)) {
      const m = ua.match(/Edg\/([\d.]+)/);
      return 'Edge ' + (m ? m[1].split('.')[0] : '');
    }
    if (/OPR\/([\d.]+)/.test(ua) || /Opera/.test(ua)) {
      const m = ua.match(/OPR\/([\d.]+)/);
      return 'Opera ' + (m ? m[1].split('.')[0] : '');
    }
    if (/SamsungBrowser\/([\d.]+)/.test(ua)) {
      const m = ua.match(/SamsungBrowser\/([\d.]+)/);
      return 'Samsung Internet ' + (m ? m[1].split('.')[0] : '');
    }
    if (/Chrome\/([\d.]+)/.test(ua) && !/Edg|OPR/.test(ua)) {
      const m = ua.match(/Chrome\/([\d.]+)/);
      return 'Chrome ' + (m ? m[1].split('.')[0] : '');
    }
    if (/Firefox\/([\d.]+)/.test(ua)) {
      const m = ua.match(/Firefox\/([\d.]+)/);
      return 'Firefox ' + (m ? m[1].split('.')[0] : '');
    }
    if (/Version\/([\d.]+).*Safari/.test(ua) && !/Chrome|Chromium/.test(ua)) {
      const m = ua.match(/Version\/([\d.]+)/);
      return 'Safari ' + (m ? m[1].split('.')[0] : '');
    }
    return 'Unknown browser';
  }

  function detectDeviceType(ua) {
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return 'tablet';
    if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return 'mobile';
    if (navigator.maxTouchPoints > 1 && screen.width < 1024) return 'tablet';
    return 'desktop';
  }

  function normalizeModelName(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed === 'K' || trimmed === 'Linux') return null;

    const upper = trimmed.toUpperCase();
    if (SAMSUNG_MODELS[upper]) return SAMSUNG_MODELS[upper];
    if (/^SM-/.test(upper)) return 'Samsung ' + trimmed;

    return trimmed;
  }

  function detectAndroidModelFromUA(ua) {
    // Android 14; Pixel 8 Pro Build/...
    // Android 14; SM-G991B Build/...
    // Android 14; Redmi Note 12 Build/...
    const patterns = [
      /Android [\d.]+;\s*([^;)]+?)\s+Build\//i,
      /Android [\d.]+;\s*([^;)]+?)\s*;/i,
      /;\s*([^;)]+)\s+Build\//i,
    ];
    for (const re of patterns) {
      const m = ua.match(re);
      if (m) {
        const name = normalizeModelName(m[1]);
        if (name) return name;
      }
    }
    return null;
  }

  function detectiPhoneModelFromScreen() {
    const w = Math.min(screen.width, screen.height);
    const h = Math.max(screen.width, screen.height);
    const key = `${w}x${h}@${window.devicePixelRatio || 1}`;
    return IPHONE_SCREENS[key] || null;
  }

  async function fetchClientHintsModel() {
    try {
      if (!navigator.userAgentData?.getHighEntropyValues) return null;
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'model',
        'platform',
        'platformVersion',
        'mobile',
      ]);
      if (hints.model) {
        return {
          model: normalizeModelName(hints.model) || hints.model,
          platformVersion: hints.platformVersion || null,
          source: 'client-hints',
        };
      }
    } catch (e) { /* blocked or unsupported */ }
    return null;
  }

  function detectModelFromUA(ua, type) {
    if (/iPhone/.test(ua)) {
      return detectiPhoneModelFromScreen() || 'iPhone';
    }
    if (/iPod/.test(ua)) return 'iPod touch';
    if (/iPad/.test(ua)) {
      return detectiPhoneModelFromScreen() || 'iPad';
    }

    const android = detectAndroidModelFromUA(ua);
    if (android) return android;

    if (/Pixel/i.test(ua)) {
      const m = ua.match(/Pixel [\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/OnePlus/i.test(ua)) {
      const m = ua.match(/OnePlus[\w ]*/i);
      if (m) return m[0].trim();
    }
    if (/Redmi|POCO|Mi [\w ]+/i.test(ua)) {
      const m = ua.match(/Redmi [\w ]+|POCO [\w ]+|Mi [\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/vivo/i.test(ua)) {
      const m = ua.match(/vivo [\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/OPPO/i.test(ua)) {
      const m = ua.match(/OPPO[\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/Realme/i.test(ua)) {
      const m = ua.match(/Realme[\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/Motorola|moto/i.test(ua)) {
      const m = ua.match(/moto[\w ]+|Motorola[\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/Nokia/i.test(ua)) {
      const m = ua.match(/Nokia[\w ]+/i);
      if (m) return m[0].trim();
    }
    if (/HUAWEI|Huawei/i.test(ua)) {
      const m = ua.match(/HUAWEI[\w-]+|Huawei[\w-]+/i);
      if (m) return m[0].trim();
    }

    if (type === 'desktop') return 'Desktop / Laptop';
    return type === 'tablet' ? 'Tablet' : 'Mobile';
  }

  function buildDeviceInfo(ua, type, model, modelSource, extra) {
    const os = detectOS(ua);
    const browser = detectBrowser(ua);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const info = {
      type,
      os,
      browser,
      model,
      modelSource: modelSource || 'user-agent',
      modelCode: extra?.modelCode || null,
      platform: navigator.platform || '',
      language: navigator.language || '',
      languages: (navigator.languages || []).join(', '),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth || null,
      touchPoints: navigator.maxTouchPoints || 0,
      cores: navigator.hardwareConcurrency || null,
      memoryGB: navigator.deviceMemory || null,
      connection: conn
        ? {
            effectiveType: conn.effectiveType || null,
            downlinkMbps: conn.downlink ?? null,
            rttMs: conn.rtt ?? null,
            saveData: conn.saveData ?? false,
          }
        : null,
      userAgent: ua,
      summary: `${model} · ${os} · ${browser}`,
    };

    return info;
  }

  function getDeviceInfo() {
    const ua = navigator.userAgent || '';
    const type = detectDeviceType(ua);
    const model = detectModelFromUA(ua, type);
    return buildDeviceInfo(ua, type, model, 'user-agent');
  }

  async function getDeviceInfoAsync() {
    const ua = navigator.userAgent || '';
    const type = detectDeviceType(ua);

    const hints = await fetchClientHintsModel();
    if (hints?.model) {
      return buildDeviceInfo(ua, type, hints.model, 'client-hints', {
        modelCode: hints.model,
      });
    }

    const uaModel = detectModelFromUA(ua, type);
    const source = /iPhone|iPad/.test(ua) && detectiPhoneModelFromScreen()
      ? 'screen-fingerprint'
      : detectAndroidModelFromUA(ua)
        ? 'android-ua'
        : 'user-agent';

    return buildDeviceInfo(ua, type, uaModel, source);
  }

  function deviceLabel(device) {
    if (!device) return 'Unknown device';
    if (device.model) return `${device.model} · ${device.os || ''} · ${device.browser || ''}`.replace(/\s·\s$/, '');
    if (device.summary) return device.summary;
    return [device.model, device.os, device.browser].filter(Boolean).join(' · ') || 'Unknown device';
  }

  global.getDeviceInfo = getDeviceInfo;
  global.getDeviceInfoAsync = getDeviceInfoAsync;
  global.deviceLabel = deviceLabel;
})(typeof window !== 'undefined' ? window : globalThis);
