'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Toast from '@/components/Toast'
import { supabase } from '@/lib/supabase'
import type { SessionKeyword, Session } from '@/lib/supabase'

interface KeywordWithVotes extends SessionKeyword {
  voteCount: number
  hasVoted: boolean
}

export default function KeywordVoting() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [keywords, setKeywords] = useState<KeywordWithVotes[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isCreator, setIsCreator] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    if (!sessionId || !userId) return

    fetchSession()
    fetchKeywords()
    checkIfCreator()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`keyword_votes_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keyword_votes',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          fetchKeywords()
        }
      )
      .subscribe()

    // Subscribe to session status changes
    const sessionChannel = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          setSession(payload.new as Session)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(sessionChannel)
    }
  }, [sessionId, userId])

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
    if (!sessionId || !userId) return

    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    if (!userData) return
    setUserName(userData.name)

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('creator_name')
      .eq('id', sessionId)
      .single()

    if (sessionData && userData.name === sessionData.creator_name) {
      setIsCreator(true)
    }
  }

  const fetchKeywords = async () => {
    if (!sessionId || !userId) return

    // Get session keywords
    const { data: keywordData } = await supabase
      .from('session_keywords')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (!keywordData) return

    // Get all votes for this session
    const { data: votesData } = await supabase
      .from('keyword_votes')
      .select('keyword, user_id')
      .eq('session_id', sessionId)

    // Count votes and check if current user has voted
    const keywordsWithVotes = keywordData.map(keyword => {
      const votes = votesData?.filter(v => v.keyword === keyword.keyword) || []
      const hasVoted = votes.some(v => v.user_id === userId)

      return {
        ...keyword,
        voteCount: votes.length,
        hasVoted
      }
    })

    setKeywords(keywordsWithVotes)
  }

  const handleVote = async (keyword: string) => {
    if (!sessionId || !userId) return

    // Check if already voted
    const keywordData = keywords.find(k => k.keyword === keyword)
    if (keywordData?.hasVoted) {
      setToastMessage('이미 이 키워드에 투표했습니다')
      setShowToast(true)
      return
    }

    // Check if voting is closed
    if (!session?.keyword_voting_active) {
      setToastMessage('키워드 투표가 종료되었습니다')
      setShowToast(true)
      return
    }

    try {
      const { error: voteError } = await supabase
        .from('keyword_votes')
        .insert({
          session_id: sessionId,
          user_id: userId,
          keyword
        })

      if (voteError) {
        // Check if it's a duplicate error
        if (voteError.code === '23505') {
          setToastMessage('이미 이 키워드에 투표했습니다')
        } else {
          throw voteError
        }
      } else {
        setToastMessage(`"${keyword}" 투표 완료!`)

        // Update participant voted_keywords status
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single()

        if (userData) {
          await supabase
            .from('participants')
            .update({ voted_keywords: true })
            .eq('session_id', sessionId)
            .eq('name', userData.name)
        }
      }

      setShowToast(true)
      fetchKeywords()
    } catch (err: any) {
      console.error('Error voting:', err)
      setError(`투표 실패: ${err.message}`)
    }
  }

  const handleEndVoting = async () => {
    if (!sessionId) return

    if (!confirm('키워드 투표를 종료하시겠습니까? 종료 후에는 더 이상 투표할 수 없습니다.')) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          keyword_voting_active: false,
          voting_phase: 'place_registration'
        })
        .eq('id', sessionId)

      if (error) throw error

      setToastMessage('키워드 투표가 종료되었습니다')
      setShowToast(true)

      // Navigate to admin page to add restaurants
      setTimeout(() => {
        router.push(`/admin?sessionId=${sessionId}`)
      }, 1500)
    } catch (err: any) {
      console.error('Error ending voting:', err)
      setError(`종료 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewResults = () => {
    router.push(`/keyword-results?sessionId=${sessionId}&userId=${userId}`)
  }

  if (!sessionId || !userId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <p className="text-error">유효하지 않은 링크입니다.</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-h2 mb-2">1차 투표: 오늘은 뭐 먹을까요?</h1>
          <p className="text-body text-text-secondary">
            마음에 드는 키워드에 투표하세요 (여러 개 가능, 키워드당 1회만)
          </p>
        </div>

        {!session?.keyword_voting_active && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-button p-4 mb-6">
            <p className="text-body text-yellow-800">
              ⚠️ 키워드 투표가 종료되었습니다. 세션장이 맛집을 등록 중입니다.
            </p>
          </div>
        )}

        {keywords.length === 0 ? (
          <Card>
            <p className="text-text-secondary text-center">
              키워드가 없습니다. 세션 생성자가 키워드를 추가해주세요.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {keywords.map(keyword => (
              <button
                key={keyword.id}
                onClick={() => handleVote(keyword.keyword)}
                disabled={keyword.hasVoted || !session?.keyword_voting_active}
                className={`
                  p-4 rounded-button border-2 transition-all
                  ${keyword.hasVoted
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-surface hover:border-primary'
                  }
                  ${!session?.keyword_voting_active ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:cursor-not-allowed
                `}
              >
                <div className="text-center">
                  <p className="text-body font-medium mb-1">
                    {keyword.keyword}
                  </p>
                  <p className={`text-caption ${keyword.hasVoted ? 'text-white' : 'text-text-secondary'}`}>
                    {keyword.hasVoted ? '✓ 투표 완료' : `${keyword.voteCount}표`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-button">
            <p className="text-caption text-red-600">{error}</p>
          </div>
        )}

        <div className="sticky bottom-4 space-y-3">
          <Button
            onClick={handleViewResults}
            variant="secondary"
            className="w-full"
          >
            📊 실시간 투표 결과 보기
          </Button>

          {isCreator && session?.keyword_voting_active && (
            <Button
              onClick={handleEndVoting}
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary-dark"
            >
              {loading ? '종료 중...' : '🔒 키워드 투표 종료하고 맛집 등록하기'}
            </Button>
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
