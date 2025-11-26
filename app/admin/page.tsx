'use client'


import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import KeywordChip from '@/components/KeywordChip'
import Tag from '@/components/Tag'
import Toast from '@/components/Toast'
import { supabase } from '@/lib/supabase'

interface Keyword {
  id: string
  label: string
}

interface Place {
  id: string
  name: string
  category: string
  keywords: string[]
  description: string | null
}

export default function Admin() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('sessionId')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('한식')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    fetchKeywords()
    if (sessionId) {
      fetchPlaces()
    }
  }, [sessionId])

  const fetchKeywords = async () => {
    const { data } = await supabase.from('keywords').select('*')
    if (data) {
      setAvailableKeywords(data)
    }
  }

  const fetchPlaces = async () => {
    if (!sessionId) return
    const { data } = await supabase
      .from('places')
      .select('*')
      .eq('session_id', sessionId)
    if (data) {
      setPlaces(data)
    }
  }

  const toggleKeyword = (label: string) => {
    setSelectedKeywords(prev =>
      prev.includes(label) ? prev.filter(k => k !== label) : [...prev, label]
    )
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
        category,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        keywords: selectedKeywords,
      })

      if (error) throw error

      setToastMessage('장소가 추가되었습니다!')
      setShowToast(true)

      setName('')
      setDescription('')
      setImageUrl('')
      setSelectedKeywords([])
      setCategory('한식')

      fetchPlaces()
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
        <h1 className="text-h2 mb-6">장소 관리 (세션 관리자)</h1>

        <Card className="mb-8">
          <h2 className="text-h3 mb-4">새 장소 추가</h2>

          <div className="space-y-4">
            <Input
              label="장소 이름"
              placeholder="예: 홍대 김치찌개"
              value={name}
              onChange={e => setName(e.target.value)}
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
              label="설명 (선택)"
              placeholder="간단한 설명을 입력하세요"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <Input
              label="이미지 URL (선택)"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />

            <div>
              <label className="block text-caption text-text-secondary mb-2">
                특징 키워드 선택
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableKeywords.map(keyword => (
                  <KeywordChip
                    key={keyword.id}
                    label={keyword.label}
                    selected={selectedKeywords.includes(keyword.label)}
                    onClick={() => toggleKeyword(keyword.label)}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddPlace} disabled={loading} className="w-full">
              {loading ? '추가 중...' : '장소 추가'}
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="text-h3 mb-4">등록된 장소 ({places.length}개)</h2>
          {places.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">
                아직 등록된 장소가 없습니다
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {places.map(place => (
                <Card key={place.id}>
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
