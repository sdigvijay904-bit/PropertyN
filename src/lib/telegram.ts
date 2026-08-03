/**
 * Utility to format and reliably open Telegram channel and support links
 * across all mobile browsers, PWAs, iOS Safari, Android Chrome, and WebViews (Meta/Instagram Ads).
 */

export function formatTelegramUrl(rawUrl?: string | null, defaultFallback: string = 'https://t.me/PropertyN_99'): string {
  if (!rawUrl) return defaultFallback;
  let trimmed = rawUrl.trim();
  if (!trimmed) return defaultFallback;

  // Handle @username format
  if (trimmed.startsWith('@')) {
    return `https://t.me/${trimmed.substring(1)}`;
  }

  // Handle plain username (no slashes, no http, e.g. "PropertyN_99")
  if (!trimmed.includes('/') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('tg://')) {
    return `https://t.me/${trimmed}`;
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
  
  // Remove protocol and domain
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me|telegram\.dog)\//i, '');
  cleaned = cleaned.replace(/^s\//i, ''); // remove /s/ channel preview prefix if present
  
  if (cleaned.startsWith('+') || cleaned.startsWith('joinchat/')) return ''; // private invite link
  
  // Take only the username part before any extra path or query params
  const handlePart = cleaned.split('/')[0].split('?')[0].split('#')[0];
  return handlePart.replace(/[^a-zA-Z0-9_]/g, '');
}

export function openTelegramUrl(rawUrl?: string | null, defaultFallback: string = 'https://t.me/PropertyN_99'): void {
  const finalUrl = formatTelegramUrl(rawUrl, defaultFallback);
  const handle = extractTelegramHandle(finalUrl);

  const isMetaOrMobileWebView = typeof navigator !== 'undefined' && /FBAN|FBAV|Instagram|MetaApp|MicroMessenger|WebView|Android.*Version\/[0-9]/i.test(navigator.userAgent);

  // 1. If we have a valid handle, attempt direct Telegram App launch using tg://resolve protocol
  // This uses native Telegram URI scheme which works cleanly on both Android and iOS without "Username not found" intent bugs
  if (handle) {
    const tgScheme = `tg://resolve?domain=${handle}`;
    try {
      const link = document.createElement('a');
      link.href = tgScheme;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // ignore
    }
  } else if (finalUrl.startsWith('https://t.me/+') || finalUrl.includes('/joinchat/')) {
    // Handle private invite link deep link (tg://join?invite=...)
    const inviteCode = finalUrl.includes('/+') ? finalUrl.split('/+')[1]?.split('?')[0] : finalUrl.split('joinchat/')[1]?.split('?')[0];
    if (inviteCode) {
      try {
        const link = document.createElement('a');
        link.href = `tg://join?invite=${inviteCode}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // ignore
      }
    }
  }

  // 2. Fallback Web Navigation after 350ms delay if app did not open
  setTimeout(() => {
    // For Meta Ads / Instagram In-App browser, if public channel, t.me/s/handle is Telegram's official preview
    let webUrl = finalUrl;
    if (handle && isMetaOrMobileWebView && !finalUrl.includes('/+')) {
      webUrl = `https://t.me/s/${handle}`;
    }

    try {
      if (isMetaOrMobileWebView) {
        window.location.href = webUrl;
      } else {
        const win = window.open(webUrl, '_blank', 'noopener,noreferrer');
        if (!win || win.closed || typeof win.closed === 'undefined') {
          window.location.href = webUrl;
        }
      }
    } catch {
      window.location.href = webUrl;
    }
  }, handle ? 350 : 0);
}


