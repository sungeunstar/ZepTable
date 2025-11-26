import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '쩝테이블 - 모임 메뉴 투표',
  description: '모임에서 "오늘 뭐 먹지?"를 빠르게 결정하는 메뉴/장소 투표 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
