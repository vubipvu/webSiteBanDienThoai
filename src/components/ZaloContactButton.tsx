import type { ReactNode } from 'react'
import { useAppearance } from '../context/AppearanceContext'

type Props = {
  productName: string
  className?: string
  children?: ReactNode
}

  /** Nút Liên hệ → mở Zalo (cùng zalo_phone / zaloUrl). */
export function ZaloContactButton({
  productName,
  className = 'btn btn-accent',
  children = 'Liên hệ',
}: Props) {
  const { appearance } = useAppearance()
  const href = `${appearance.zaloUrl}?text=${encodeURIComponent(
    `Xin chào ATM66 Mobile, mình muốn hỏi về: ${productName}`,
  )}`

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}
