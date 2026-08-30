(function (global) {
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

  function detectModel(ua, type) {
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Pixel ([\w ]+)/i.test(ua)) {
      const m = ua.match(/Pixel ([\w ]+)/i);
      return 'Google Pixel ' + (m ? m[1].trim() : '');
    }
    if (/SM-[\w]+/.test(ua)) {
      const m = ua.match(/SM-[\w]+/);
      return 'Samsung ' + m[0];
    }
    if (/Redmi|Mi [\w ]+/i.test(ua)) {
      const m = ua.match(/Redmi [\w ]+|Mi [\w ]+/i);
      return m ? m[0].trim() : 'Xiaomi';
    }
    if (/OnePlus[\w ]*/i.test(ua)) {
      const m = ua.match(/OnePlus[\w ]*/i);
      return m ? m[0].trim() : 'OnePlus';
    }
    if (type === 'desktop') return 'Desktop/Laptop';
    return type === 'tablet' ? 'Tablet' : 'Mobile';
  }

  function getDeviceInfo() {
    const ua = navigator.userAgent || '';
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const type = detectDeviceType(ua);
    const os = detectOS(ua);
    const browser = detectBrowser(ua);
    const model = detectModel(ua, type);

    const info = {
      type,
      os,
      browser,
      model,
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

  function deviceLabel(device) {
    if (!device) return 'Unknown device';
    if (device.summary) return device.summary;
    return [device.model, device.os, device.browser].filter(Boolean).join(' · ') || 'Unknown device';
  }

  global.getDeviceInfo = getDeviceInfo;
  global.deviceLabel = deviceLabel;
})(typeof window !== 'undefined' ? window : globalThis);
