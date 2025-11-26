'use client'


import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

export default function PlaceVote() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [places, setPlaces] = useState<Place[]>([])
  const [votedPlaces, setVotedPlaces] = useState<Set<string>>(new Set())
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (!sessionId) return

    const fetchPlacesAndVotes = async () => {
      const { data: placesData } = await supabase
        .from('places')
        .select('*')
        .eq('session_id', sessionId)

      if (placesData) {
        setPlaces(placesData)
      }

      if (userId) {
        const { data: votesData } = await supabase
          .from('votes')
          .select('place_id')
          .eq('user_id', userId)

        if (votesData) {
          setVotedPlaces(new Set(votesData.map(v => v.place_id)))
        }
      }
    }

    fetchPlacesAndVotes()
  }, [sessionId, userId])

  const handleVote = async (placeId: string) => {
    if (!userId) return

    try {
      if (votedPlaces.has(placeId)) {
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', userId)
          .eq('place_id', placeId)

        setVotedPlaces(prev => {
          const next = new Set(prev)
          next.delete(placeId)
          return next
        })
        setToastMessage('투표가 취소되었습니다')
      } else {
        await supabase
          .from('votes')
          .insert({
            user_id: userId,
            place_id: placeId
          })

        setVotedPlaces(prev => new Set([...prev, placeId]))
        setToastMessage('투표되었습니다!')
      }
      setShowToast(true)
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  const handleGoToResults = () => {
    router.push(`/live-results?sessionId=${sessionId}`)
  }

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h2 mb-2">장소를 투표해주세요</h1>
          <p className="text-body text-text-secondary">
            마음에 드는 장소에 투표하세요 (복수 선택 가능)
          </p>
        </div>

        {places.length === 0 ? (
          <Card>
            <p className="text-text-secondary text-center">
              아직 등록된 장소가 없습니다. 세션 생성자가 장소를 추가할 때까지 기다려주세요.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {places.map(place => (
              <Card key={place.id} className={votedPlaces.has(place.id) ? 'ring-2 ring-primary' : ''}>
                {place.image_url && (
                  <img
                    src={place.image_url}
                    alt={place.name}
                    className="w-full h-48 object-cover rounded-button mb-4"
                  />
                )}
                <h3 className="text-h3 mb-2">{place.name}</h3>
                <Tag className="mb-3">{place.category}</Tag>
                {place.description && (
                  <p className="text-caption text-text-secondary mb-3">
                    {place.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {place.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="text-caption text-text-secondary bg-background px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={() => handleVote(place.id)}
                  variant={votedPlaces.has(place.id) ? 'primary' : 'secondary'}
                  className="w-full"
                >
                  {votedPlaces.has(place.id) ? '투표 완료 ✓' : '투표하기'}
                </Button>
              </Card>
            ))}
          </div>
        )}

        <div className="sticky bottom-4">
          <Button onClick={handleGoToResults} className="w-full">
            투표 결과 보기
          </Button>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </main>
  )
}
