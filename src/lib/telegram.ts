/**
 * Utility to format and reliably open Telegram channel and support links
 * across all mobile browsers, PWAs, iOS Safari, Android Chrome, and WebViews.
 */

export function formatTelegramUrl(rawUrl?: string | null, defaultFallback: string = 'https://t.me/PropertyN_99'): string {
  if (!rawUrl) return defaultFallback;
  let trimmed = rawUrl.trim();
  if (!trimmed) return defaultFallback;

  // Handle @username format
  if (trimmed.startsWith('@')) {
    return `https://t.me/${trimmed.substring(1)}`;
  }

  // Handle t.me/ or telegram.me/ or telegram.dog/ without protocol
  if (trimmed.startsWith('t.me/') || trimmed.startsWith('telegram.me/') || trimmed.startsWith('telegram.dog/')) {
    return `https://${trimmed}`;
  }

  // Handle tg:// links (direct deep links)
  if (trimmed.startsWith('tg://')) {
    return trimmed;
  }

  // Handle missing protocol
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Extracts clean username or channel handle from various Telegram link formats
 */
export function extractTelegramHandle(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  if (cleaned.startsWith('@')) return cleaned.substring(1);
  
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me|telegram\.dog)\//i, '');
  cleaned = cleaned.replace(/^s\//i, ''); // remove /s/ channel preview prefix if present
  
  if (cleaned.startsWith('+') || cleaned.startsWith('joinchat/')) return ''; // private invite
  
  return cleaned.split('/')[0].split('?')[0].replace(/[^a-zA-Z0-9_]/g, '');
}

export function openTelegramUrl(rawUrl?: string | null, defaultFallback: string = 'https://t.me/PropertyN_99'): void {
  const finalUrl = formatTelegramUrl(rawUrl, defaultFallback);
  const handle = extractTelegramHandle(finalUrl);

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isMetaOrMobileWebView = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|MetaApp|MicroMessenger|WebView/i.test(navigator.userAgent);

  // 1. If we have a clear handle and user is on Android (especially Meta/Instagram Ads WebView)
  if (handle && isAndroid) {
    // Intent URL forces Android OS to open Telegram App directly instead of Instagram internal webview
    const intentUrl = `intent://resolve?domain=${handle}#Intent;package=org.telegram.messenger;scheme=tg;end;`;
    try {
      window.location.href = intentUrl;
      // If Telegram app opens, browser halts execution here.
      // If app is not installed, fallback fires via setTimeout below.
    } catch {
      // ignore
    }
  } else if (handle) {
    // 2. iOS or standard browser - trigger tg:// deep link
    const tgScheme = `tg://resolve?domain=${handle}`;
    try {
      const a = document.createElement('a');
      a.href = tgScheme;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  }

  // 3. Fallback Web View after 400ms delay if app did not open
  setTimeout(() => {
    // For public channels inside Meta/Instagram in-app browser, t.me/s/handle is Telegram's official
    // Channel Web Preview which renders 100% reliably without "User not found" errors!
    let webFallbackUrl = finalUrl;
    if (handle && isMetaOrMobileWebView && !finalUrl.includes('/+')) {
      webFallbackUrl = `https://t.me/s/${handle}`;
    }

    try {
      if (isMetaOrMobileWebView) {
        window.location.href = webFallbackUrl;
      } else {
        const win = window.open(webFallbackUrl, '_blank', 'noopener,noreferrer');
        if (!win || win.closed) {
          window.location.href = webFallbackUrl;
        }
      }
    } catch {
      window.location.href = webFallbackUrl;
    }
  }, handle ? 400 : 0);
}

