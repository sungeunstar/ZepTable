'use client'


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

export default function KeywordSelect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchKeywords = async () => {
      const { data } = await supabase
        .from('keywords')
        .select('*')

      if (data) {
        setKeywords(data)
      }
    }

    fetchKeywords()
  }, [])

  const toggleKeyword = (label: string) => {
    setSelectedKeywords(prev =>
      prev.includes(label)
        ? prev.filter(k => k !== label)
        : [...prev, label]
    )
  }

  const handleComplete = async () => {
    if (selectedKeywords.length === 0) {
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
      const { error: updateError } = await supabase
        .from('users')
        .update({ selected_keywords: selectedKeywords })
        .eq('id', userId)

      if (updateError) throw updateError

      router.push(`/place-vote?sessionId=${sessionId}&userId=${userId}`)
    } catch (err) {
      console.error('Error updating keywords:', err)
      setError('키워드 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <h1 className="text-h2 mb-2">키워드를 선택해주세요</h1>
        <p className="text-body text-text-secondary mb-6">
          오늘 어떤 분위기의 식사를 원하시나요? (최소 1개)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {keywords.map(keyword => (
            <KeywordChip
              key={keyword.id}
              label={keyword.label}
              selected={selectedKeywords.includes(keyword.label)}
              onClick={() => toggleKeyword(keyword.label)}
            />
          ))}
        </div>

        {error && (
          <p className="text-error text-caption mb-4">{error}</p>
        )}

        <Button
          onClick={handleComplete}
          disabled={loading || selectedKeywords.length === 0}
          className="w-full"
        >
          {loading ? '저장 중...' : `키워드 선택 완료 (${selectedKeywords.length}개)`}
        </Button>
      </Card>
    </main>
  )
}
