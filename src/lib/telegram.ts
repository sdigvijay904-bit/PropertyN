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
  
  try {
    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Fallback for mobile webviews or popup blockers where window.open returns null
      window.location.href = finalUrl;
    }
  } catch {
    window.location.href = finalUrl;
  }
}
