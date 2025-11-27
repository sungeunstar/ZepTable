'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import Toast from '@/components/Toast'
import { supabase } from '@/lib/supabase'

interface KeywordResult {
  keyword: string
  count: number
}

interface Place {
  id: string
  name: string
  category: string
  keywords: string[]
  description: string | null
  link: string | null
  price_range: string | null
}

export default function Admin() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [name, setName] = useState('')
  const [link, setLink] = useState('')
  const [category, setCategory] = useState('한식')
  const [description, setDescription] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [keywordResults, setKeywordResults] = useState<KeywordResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (sessionId) {
      fetchPlaces()
      fetchKeywordVotes()
    }
  }, [sessionId])

  const fetchKeywordVotes = async () => {
    if (!sessionId) return

    const { data: votes } = await supabase
      .from('keyword_votes')
      .select('keyword')
      .eq('session_id', sessionId)

    if (votes) {
      const counts = votes.reduce((acc, vote) => {
        acc[vote.keyword] = (acc[vote.keyword] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const sorted = Object.entries(counts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 7)

      setKeywordResults(sorted)
    }
  }

  const fetchPlaces = async () => {
    if (!sessionId) return
    const { data } = await supabase
      .from('places')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_suggestion', false)
    if (data) {
      setPlaces(data)
    }
  }

  const handleAddPlace = async () => {
    if (!name.trim()) {
      setToastMessage('장소 이름을 입력해주세요')
      setShowToast(true)
      return
    }

    if (!sessionId) {
      setToastMessage('세션 ID가 없습니다')
      setShowToast(true)
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('places').insert({
        session_id: sessionId,
        name: name.trim(),
        link: link.trim() || null,
        category,
        description: description.trim() || null,
        price_range: priceRange.trim() || null,
        keywords: [],
        is_suggestion: false
      })

      if (error) throw error

      setToastMessage('장소가 추가되었습니다!')
      setShowToast(true)

      setName('')
      setLink('')
      setDescription('')
      setPriceRange('')
      setCategory('한식')

      fetchPlaces()

      // If 2+ places, update voting phase
      if (places.length + 1 >= 2) {
        await supabase
          .from('sessions')
          .update({ voting_phase: 'place_voting' })
          .eq('id', sessionId)
      }
    } catch (err) {
      console.error('Error adding place:', err)
      setToastMessage('장소 추가에 실패했습니다')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlace = async (placeId: string) => {
    try {
      const { error } = await supabase.from('places').delete().eq('id', placeId)

      if (error) throw error

      setToastMessage('장소가 삭제되었습니다')
      setShowToast(true)
      fetchPlaces()
    } catch (err) {
      console.error('Error deleting place:', err)
      setToastMessage('삭제에 실패했습니다')
      setShowToast(true)
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <p className="text-error">세션 ID가 필요합니다</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-h2 mb-6">맛집 후보 등록 (쩝쩝박사)</h1>

        {keywordResults.length > 0 && (
          <Card className="mb-8 bg-primary-light">
            <h3 className="text-h3 mb-4">💡 1차 투표 인기 키워드</h3>
            <div className="flex flex-wrap gap-2">
              {keywordResults.map((result, idx) => (
                <Tag key={result.keyword} variant="success">
                  #{idx + 1} {result.keyword} ({result.count}표)
                </Tag>
              ))}
            </div>
            <p className="text-caption text-text-secondary mt-3">
              이 키워드를 참고해서 맛집을 골라주세요!
            </p>
          </Card>
        )}

        <Card className="mb-8">
          <h2 className="text-h3 mb-4">새 맛집 후보 추가</h2>

          <div className="space-y-4">
            <Input
              label="가게 이름"
              placeholder="예: 홍대 김치찌개"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <Input
              label="링크 (네이버/카카오맵)"
              placeholder="https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />

            <div>
              <label className="block text-caption text-text-secondary mb-2">
                카테고리
              </label>
              <select
                className="w-full px-4 py-3 rounded-button border border-border bg-white text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="한식">한식</option>
                <option value="중식">중식</option>
                <option value="일식">일식</option>
                <option value="양식">양식</option>
                <option value="분식">분식</option>
                <option value="카페">카페</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <Input
              label="가격대 (선택)"
              placeholder="예: 10,000~15,000원"
              value={priceRange}
              onChange={e => setPriceRange(e.target.value)}
            />

            <Input
              label="간단 설명 (선택)"
              placeholder="한 줄 설명"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <Button onClick={handleAddPlace} disabled={loading} className="w-full">
              {loading ? '추가 중...' : '후보 추가'}
            </Button>
          </div>
        </Card>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-h3">등록된 후보 ({places.length}개)</h2>
            {places.length >= 2 && (
              <Tag variant="success">2차 투표 시작 가능!</Tag>
            )}
          </div>

          {places.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">
                아직 등록된 후보가 없습니다. 최소 2개 이상 등록하세요.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map(place => (
                <Card key={place.id}>
                  <h3 className="text-h3 mb-2">{place.name}</h3>
                  <Tag className="mb-3">{place.category}</Tag>
                  {place.price_range && (
                    <p className="text-caption text-text-secondary mb-2">
                      💰 {place.price_range}
                    </p>
                  )}
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
                      className="text-caption text-primary hover:underline block mb-3"
                    >
                      🔗 지도에서 보기
                    </a>
                  )}
                  <Button
                    onClick={() => handleDeletePlace(place.id)}
                    variant="ghost"
                    className="w-full text-error"
                  >
                    삭제
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {places.length >= 2 && (
            <Card className="mt-6 bg-primary-light">
              <h3 className="text-h3 mb-2">✅ 준비 완료!</h3>
              <p className="text-body text-text-secondary">
                참여자들에게 링크를 공유하면 2차 투표가 자동으로 시작됩니다.
              </p>
            </Card>
          )}
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
