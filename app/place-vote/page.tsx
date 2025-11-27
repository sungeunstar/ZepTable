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
  link: string | null
  price_range: string | null
  is_suggestion: boolean
  suggested_by: string | null
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
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [suggestName, setSuggestName] = useState('')
  const [suggestLink, setSuggestLink] = useState('')
  const [suggestDescription, setSuggestDescription] = useState('')

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
    if (!userId || !sessionId) return

    try {
      // Check if user has already voted for ANY restaurant
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('place_id, places(session_id)')
        .eq('user_id', userId)

      // Filter votes for this session only
      const sessionVotes = existingVotes?.filter(
        (v: any) => v.places?.session_id === sessionId
      ) || []

      if (votedPlaces.has(placeId)) {
        // Cancel existing vote
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

        // Update participant voted_restaurant status
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single()

        if (userData) {
          await supabase
            .from('participants')
            .update({ voted_restaurant: false })
            .eq('session_id', sessionId)
            .eq('name', userData.name)
        }
      } else {
        // Check 1-person-1-vote rule
        if (sessionVotes.length > 0) {
          setToastMessage('이미 다른 음식점에 투표했습니다. 먼저 기존 투표를 취소해주세요.')
          setShowToast(true)
          return
        }

        // Add new vote
        await supabase
          .from('votes')
          .insert({
            user_id: userId,
            place_id: placeId
          })

        setVotedPlaces(prev => new Set([placeId]))
        setToastMessage('투표되었습니다!')

        // Update participant voted_restaurant status
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single()

        if (userData) {
          await supabase
            .from('participants')
            .update({ voted_restaurant: true })
            .eq('session_id', sessionId)
            .eq('name', userData.name)
        }
      }
      setShowToast(true)
    } catch (err) {
      console.error('Error voting:', err)
      setToastMessage('투표 중 오류가 발생했습니다')
      setShowToast(true)
    }
  }

  const handleGoToResults = () => {
    router.push(`/live-results?sessionId=${sessionId}`)
  }

  const handleSubmitSuggestion = async () => {
    if (!suggestName.trim()) {
      setToastMessage('장소 이름을 입력해주세요')
      setShowToast(true)
      return
    }

    try {
      const { data, error } = await supabase
        .from('places')
        .insert({
          session_id: sessionId,
          name: suggestName.trim(),
          link: suggestLink.trim() || null,
          category: '제안',
          description: suggestDescription.trim() || null,
          price_range: null,
          keywords: [],
          is_suggestion: true,
          suggested_by: userId
        })
        .select()
        .single()

      if (error) throw error

      // Add to places list
      if (data) {
        setPlaces(prev => [...prev, data])
      }

      // Reset form and close modal
      setSuggestName('')
      setSuggestLink('')
      setSuggestDescription('')
      setShowSuggestModal(false)
      setToastMessage('장소 제안이 등록되었습니다!')
      setShowToast(true)
    } catch (err) {
      console.error('Error submitting suggestion:', err)
      setToastMessage('제안 등록에 실패했습니다')
      setShowToast(true)
    }
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
                <div className="flex gap-2 mb-3">
                  <Tag>{place.category}</Tag>
                  {place.is_suggestion && (
                    <Tag className="bg-secondary text-white">참여자 제안</Tag>
                  )}
                </div>
                {place.description && (
                  <p className="text-caption text-text-secondary mb-3">
                    {place.description}
                  </p>
                )}
                {place.link && (
                  <a
                    href={place.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption text-primary hover:underline mb-2 block"
                  >
                    🔗 지도에서 보기
                  </a>
                )}
                {place.price_range && (
                  <p className="text-caption text-text-secondary mb-3">
                    💰 {place.price_range}
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

        <div className="sticky bottom-4 space-y-3">
          <Button
            onClick={() => setShowSuggestModal(true)}
            variant="secondary"
            className="w-full"
          >
            💡 다른 곳 제안하기
          </Button>
          <Button onClick={handleGoToResults} className="w-full">
            투표 결과 보기
          </Button>
        </div>
      </div>

      {/* Suggestion Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-h3 mb-4">다른 곳 제안하기</h3>
            <p className="text-caption text-text-secondary mb-4">
              추천하고 싶은 장소가 있다면 제안해주세요!
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-body mb-2">
                  장소 이름 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={suggestName}
                  onChange={(e) => setSuggestName(e.target.value)}
                  placeholder="예: 강남역 맛집"
                  className="w-full px-4 py-3 border-2 border-surface rounded-button text-body focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-body mb-2">
                  지도 링크 (선택)
                </label>
                <input
                  type="text"
                  value={suggestLink}
                  onChange={(e) => setSuggestLink(e.target.value)}
                  placeholder="네이버/카카오맵 링크"
                  className="w-full px-4 py-3 border-2 border-surface rounded-button text-body focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-body mb-2">
                  한 줄 설명 (선택)
                </label>
                <textarea
                  value={suggestDescription}
                  onChange={(e) => setSuggestDescription(e.target.value)}
                  placeholder="이 장소를 추천하는 이유를 간단히 써주세요"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-surface rounded-button text-body focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSuggestModal(false)}
                  variant="secondary"
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmitSuggestion}
                  className="flex-1"
                >
                  제안하기
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

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
