'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/Button'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <h1 className="text-h1 mb-4">쩝테이블</h1>
        <p className="text-body text-text-secondary mb-8">
          모임에서 &quot;오늘 뭐 먹지?&quot;를 빠르게 결정하는 메뉴/장소 투표 시스템
        </p>
        <Button
          onClick={() => router.push('/create-session')}
          className="w-full"
        >
          새 쩝테이블 만들기
        </Button>
      </div>
    </main>
  )
}
