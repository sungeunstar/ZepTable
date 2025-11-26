'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import KeywordChip from '@/components/KeywordChip'
import Card from '@/components/Card'
import { supabase } from '@/lib/supabase'

interface Keyword {
  id: string
  label: string
  category: string
}

interface KeywordsByCategory {
  [category: string]: Keyword[]
}

const CATEGORY_NAMES = {
  mood: '분위기 / 무드',
  taste: '맛 스타일',
  menu: '메뉴 성향',
  situation: '상황 / 니즈',
  other: '기타'
}

const INITIAL_SHOW_COUNT = 4

export default function KeywordVoting() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [keywordsByCategory, setKeywordsByCategory] = useState<KeywordsByCategory>({})
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    const { data } = await supabase
      .from('keywords')
      .select('*')
      .order('category', { ascending: true })

    if (data) {
      const grouped = data.reduce((acc, keyword) => {
        if (!acc[keyword.category]) {
          acc[keyword.category] = []
        }
        acc[keyword.category].push(keyword)
        return acc
      }, {} as KeywordsByCategory)
      setKeywordsByCategory(grouped)
    }
  }

  const toggleKeyword = (label: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selectedKeywords.size === 0) {
      setError('최소 1개의 키워드를 선택해주세요')
      return
    }

    if (!userId || !sessionId) {
      setError('유효하지 않은 세션입니다')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Insert keyword votes
      const votes = Array.from(selectedKeywords).map(keyword => ({
        session_id: sessionId,
        user_id: userId,
        keyword
      }))

      const { error: insertError } = await supabase
        .from('keyword_votes')
        .insert(votes)

      if (insertError) throw insertError

      // Navigate to waiting/results page
      router.push(`/keyword-results?sessionId=${sessionId}&userId=${userId}`)
    } catch (err: any) {
      console.error('Error submitting votes:', err)
      setError(`투표 제출 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h2 mb-2">1차 투표: 오늘은 뭐 먹을까요?</h1>
          <p className="text-body text-text-secondary">
            오늘 먹고 싶은 조건을 선택해주세요 (여러 개 선택 가능)
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {Object.entries(keywordsByCategory).map(([category, keywords]) => {
            const isExpanded = expandedCategories.has(category)
            const displayKeywords = isExpanded
              ? keywords
              : keywords.slice(0, INITIAL_SHOW_COUNT)
            const hasMore = keywords.length > INITIAL_SHOW_COUNT

            return (
              <Card key={category}>
                <h3 className="text-h3 mb-4">
                  {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {displayKeywords.map(keyword => (
                    <KeywordChip
                      key={keyword.id}
                      label={keyword.label}
                      selected={selectedKeywords.has(keyword.label)}
                      onClick={() => toggleKeyword(keyword.label)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => toggleCategory(category)}
                    className="text-primary text-caption hover:underline"
                  >
                    {isExpanded
                      ? '접기 ▲'
                      : `더보기 (${keywords.length - INITIAL_SHOW_COUNT}개 더) ▼`
                    }
                  </button>
                )}
              </Card>
            )
          })}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-error/10 text-error rounded-button">
            {error}
          </div>
        )}

        <div className="sticky bottom-4">
          <Card className="bg-primary-light">
            <div className="flex justify-between items-center mb-3">
              <span className="text-body">선택한 키워드</span>
              <span className="text-h3 text-primary">{selectedKeywords.size}개</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedKeywords.size === 0}
              className="w-full"
            >
              {loading ? '제출 중...' : '투표 완료'}
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
