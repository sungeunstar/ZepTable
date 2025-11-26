'use client'


import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Toast from '@/components/Toast'

export default function ShareLink() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const [showToast, setShowToast] = useState(false)
  const [shareLink, setShareLink] = useState('')

  useEffect(() => {
    if (sessionId) {
      const link = `${window.location.origin}/join?sessionId=${sessionId}`
      setShareLink(link)
    }
  }, [sessionId])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setShowToast(true)
  }

  const handleGoToSession = () => {
    router.push(`/live-results?sessionId=${sessionId}`)
  }

  const handleGoToAdmin = () => {
    router.push(`/admin?sessionId=${sessionId}`)
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <p className="text-error">세션 ID가 없습니다.</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h1 className="text-h2 mb-4">쩝테이블이 만들어졌어요!</h1>
        <p className="text-body text-text-secondary mb-6">
          아래 링크를 공유하여 참여자들을 초대하세요
        </p>

        <div className="bg-background p-4 rounded-button mb-6 break-all text-caption">
          {shareLink}
        </div>

        <div className="space-y-3">
          <Button onClick={handleCopyLink} className="w-full">
            링크 복사하기
          </Button>
          <Button onClick={handleGoToAdmin} variant="secondary" className="w-full">
            장소 추가하기 (관리자)
          </Button>
          <Button onClick={handleGoToSession} variant="ghost" className="w-full">
            투표 현황 보기
          </Button>
        </div>
      </Card>

      {showToast && (
        <Toast
          message="링크가 복사되었습니다!"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </main>
  )
}
