'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import { supabase } from '@/lib/supabase'

interface KeywordResult {
  keyword: string
  count: number
}

export default function KeywordResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [results, setResults] = useState<KeywordResult[]>([])
  const [session, setSession] = useState<any>(null)
  const [totalVoters, setTotalVoters] = useState(0)
  const [isCreator, setIsCreator] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      fetchResults()
      fetchSession()
      checkIfCreator()
    }

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('keyword_votes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keyword_votes',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          fetchResults()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [sessionId])

  const fetchSession = async () => {
    if (!sessionId) return

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (data) {
      setSession(data)
    }
  }

  const checkIfCreator = async () => {
    if (!userId || !sessionId) return

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userData) {
      setCurrentUser(userData)
    }

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('creator_name')
      .eq('id', sessionId)
      .single()

    if (sessionData && userData) {
      setIsCreator(sessionData.creator_name === userData.name)
    }
  }

  const fetchResults = async () => {
    if (!sessionId) return

    const { data: votes } = await supabase
      .from('keyword_votes')
      .select('keyword, user_id')
      .eq('session_id', sessionId)

    if (votes) {
      // Count votes per keyword
      const counts = votes.reduce((acc, vote) => {
        acc[vote.keyword] = (acc[vote.keyword] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const sorted = Object.entries(counts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)

      setResults(sorted)

      // Count unique voters
      const uniqueVoters = new Set(votes.map(v => v.user_id))
      setTotalVoters(uniqueVoters.size)
    }
  }

  const handleProceedToPlaceRegistration = async () => {
    if (!sessionId) return

    // Update session phase
    await supabase
      .from('sessions')
      .update({ voting_phase: 'place_registration' })
      .eq('id', sessionId)

    router.push(`/admin?sessionId=${sessionId}`)
  }

  const topResults = results.slice(0, 7)

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h2 mb-2">1차 투표 결과</h1>
          <p className="text-body text-text-secondary">
            {totalVoters}명이 투표에 참여했습니다
          </p>
        </div>

        <Card className="mb-8">
          <h3 className="text-h3 mb-4">인기 키워드 TOP 7</h3>
          <div className="space-y-3">
            {topResults.map((result, index) => (
              <div key={result.keyword} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-h3 text-primary w-8">#{index + 1}</span>
                  <span className="text-body">{result.keyword}</span>
                </div>
                <Tag variant="success">{result.count}표</Tag>
              </div>
            ))}
          </div>
        </Card>

        {isCreator ? (
          <Card className="bg-primary-light">
            <h3 className="text-h3 mb-3">🎯 쩝쩝박사님!</h3>
            <p className="text-body text-text-secondary mb-4">
              위 키워드를 참고해서 맛집 후보를 등록해주세요.
              <br />
              최소 2개 이상 등록하면 2차 투표가 시작됩니다.
            </p>
            <Button onClick={handleProceedToPlaceRegistration} className="w-full">
              맛집 후보 등록하러 가기
            </Button>
          </Card>
        ) : (
          <Card>
            <h3 className="text-h3 mb-3">⏳ 잠시만 기다려주세요</h3>
            <p className="text-body text-text-secondary">
              세션장이 키워드를 확인하고 맛집 후보를 등록 중입니다.
              <br />
              후보가 등록되면 2차 투표가 시작됩니다!
            </p>
          </Card>
        )}
      </div>
    </main>
  )
}
