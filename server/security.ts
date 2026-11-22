/** Allow only https Google Maps embed URLs for public iframes. */
export function isSafeMapsEmbedUrl(raw: string): boolean {
  const value = raw.trim()
  if (!value) return true
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  const allowedHost =
    host === 'google.com' ||
    host === 'www.google.com' ||
    host === 'maps.google.com' ||
    host.endsWith('.google.com') ||
    host === 'google.com.vn' ||
    host === 'www.google.com.vn'
  if (!allowedHost) return false
  return url.pathname.includes('/maps/embed')
}

export function sanitizeMapsEmbedUrl(raw: string, fallback = ''): string {
  const value = raw.trim()
  if (!value) return fallback
  return isSafeMapsEmbedUrl(value) ? value : fallback
}
