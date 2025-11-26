'use client'


import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import Toast from '@/components/Toast'
import { supabase } from '@/lib/supabase'

interface Place {
  id: string
  name: string
  category: string
  keywords: string[]
  description: string | null
  image_url: string | null
}

export default function FinalResult() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const placeId = searchParams.get('placeId')

  const [place, setPlace] = useState<Place | null>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const fetchPlace = async () => {
      if (!placeId) return

      const { data: placeData } = await supabase
        .from('places')
        .select('*')
        .eq('id', placeId)
        .single()

      if (placeData) {
        setPlace(placeData)
      }

      const { data: votesData } = await supabase
        .from('votes')
        .select('id')
        .eq('place_id', placeId)

      if (votesData) {
        setVoteCount(votesData.length)
      }
    }

    fetchPlace()
  }, [placeId])

  const handleShare = () => {
    const shareText = `쩝테이블 투표 결과: ${place?.name} (${voteCount}표)`
    if (navigator.share) {
      navigator.share({
        title: '쩝테이블 투표 결과',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      setShowToast(true)
    }
  }

  if (!place) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <p className="text-text-secondary">로딩 중...</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-h1 mb-2">투표가 완료되었습니다!</h1>
          <p className="text-body text-text-secondary">
            최종 선택된 장소입니다
          </p>
        </div>

        <Card className="mb-6">
          {place.image_url && (
            <img
              src={place.image_url}
              alt={place.name}
              className="w-full h-64 object-cover rounded-button mb-6"
            />
          )}

          <div className="text-center mb-6">
            <h2 className="text-h1 mb-3">{place.name}</h2>
            <div className="flex justify-center gap-3 mb-4">
              <Tag>{place.category}</Tag>
              <Tag variant="success">{voteCount}표</Tag>
            </div>

            {place.description && (
              <p className="text-body text-text-secondary mb-4">
                {place.description}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              {place.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="text-caption text-text-secondary bg-background px-3 py-1 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={handleShare} className="w-full">
              결과 공유하기
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="secondary"
              className="w-full"
            >
              새 쩝테이블 만들기
            </Button>
          </div>
        </Card>
      </div>

      {showToast && (
        <Toast
          message="결과가 복사되었습니다!"
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </main>
  )
}
