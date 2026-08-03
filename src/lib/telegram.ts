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

export function openTelegramUrl(rawUrl?: string | null, defaultFallback: string = 'https://t.me/PropertyN_99'): void {
  const finalUrl = formatTelegramUrl(rawUrl, defaultFallback);
  
  // Extract username for direct app deep-linking (tg://resolve?domain=...)
  let username = '';
  if (finalUrl.includes('t.me/')) {
    const after = finalUrl.split('t.me/')[1];
    if (after && !after.startsWith('+') && !after.startsWith('joinchat/')) {
      username = after.split('/')[0].split('?')[0];
    }
  }

  const isMetaOrMobileWebView = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|MetaApp|MicroMessenger|WebView|Android.*Version\/[0-9]/i.test(navigator.userAgent);

  // 1. If username exists, attempt direct tg:// scheme launch (bypasses Meta Ads in-app browser block)
  if (username) {
    const tgScheme = `tg://resolve?domain=${username}`;
    try {
      const aElement = document.createElement('a');
      aElement.href = tgScheme;
      document.body.appendChild(aElement);
      aElement.click();
      document.body.removeChild(aElement);
    } catch {
      // ignore
    }
  }

  // 2. Perform anchor navigation or location.href fallback
  setTimeout(() => {
    try {
      const a = document.createElement('a');
      a.href = finalUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      if (isMetaOrMobileWebView) {
        window.location.href = finalUrl;
      } else {
        const win = window.open(finalUrl, '_blank', 'noopener,noreferrer');
        if (!win || win.closed) {
          window.location.href = finalUrl;
        }
      }
    }
  }, username ? 350 : 0);
}
