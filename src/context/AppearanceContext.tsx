import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../lib/api'
import type { Appearance } from '../lib/types'

const defaults: Appearance = {
  shopName: 'ATM66 Mobile',
  slogan: 'Thu mua giá cao · Bán máy Zin · Sửa chữa uy tín',
  announcement:
    'ATM66 Mobile — Thu mua máy cũ giá cao · Bán máy Zin · Sửa chữa: điện thoại, iPad, laptop',
  heroHeadline: 'Thu mua · Bán Zin.\nSửa uy tín.',
  heroSupport: '',
  featuredProductId: 'iphone-13-pro-campaign',
  accentColor: '#00b89a',
  inkColor: '#0b1220',
  mistColor: '#e8eef5',
  logoUrl: null,
  zaloPhone: '0901339616',
  zaloUrl: 'https://zalo.me/0901339616',
  shopAddress: '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
  contactName: 'Cô Long',
  mapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0445537580244!2d106.70073577586874!3d10.807899658610246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752900770e229b%3A0x63b084c96d6faf7a!2sATM66%20Mobile!5e0!3m2!1svi!2s!4v1795343450554!5m2!1svi!2s',
}

type Ctx = {
  appearance: Appearance
  reload: () => void
}

const AppearanceContext = createContext<Ctx | null>(null)

function applyTheme(a: Appearance) {
  const root = document.documentElement
  root.style.setProperty('--accent', a.accentColor)
  root.style.setProperty('--ink', a.inkColor)
  root.style.setProperty('--mist', a.mistColor)
  root.style.setProperty('--accent-deep', a.accentColor)
  root.style.setProperty('--ink-soft', a.inkColor)
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(defaults)

  const load = () => {
    api<{
      shopName: string
      slogan: string
      announcement: string
      heroHeadline: string
      heroSupport: string
      featuredProductId: string
      accentColor: string
      inkColor: string
      mistColor: string
      logoUrl: string | null
      zaloPhone: string
      zaloUrl: string
      shopAddress?: string
      contactName?: string
      mapsEmbedUrl?: string
    }>('/api/settings/public')
      .then((d) => {
        const next: Appearance = {
          shopName: d.shopName || defaults.shopName,
          slogan: d.slogan || defaults.slogan,
          announcement: d.announcement || defaults.announcement,
          heroHeadline: d.heroHeadline || defaults.heroHeadline,
          heroSupport: d.heroSupport || '',
          featuredProductId: d.featuredProductId || defaults.featuredProductId,
          accentColor: d.accentColor || defaults.accentColor,
          inkColor: d.inkColor || defaults.inkColor,
          mistColor: d.mistColor || defaults.mistColor,
          logoUrl: d.logoUrl,
          zaloPhone: d.zaloPhone || defaults.zaloPhone,
          zaloUrl: d.zaloUrl || defaults.zaloUrl,
          shopAddress: d.shopAddress || defaults.shopAddress,
          contactName: d.contactName || defaults.contactName,
          mapsEmbedUrl: d.mapsEmbedUrl || defaults.mapsEmbedUrl,
        }
        setAppearance(next)
        applyTheme(next)
      })
      .catch(() => applyTheme(defaults))
  }

  useEffect(() => {
    load()
  }, [])

  const value = useMemo(() => ({ appearance, reload: load }), [appearance])

  return (
    <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
  )
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider')
  return ctx
}
