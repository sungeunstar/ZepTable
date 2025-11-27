'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/lib/supabase'

interface KeywordResult {
  keyword: string
  voteCount: number
  voters: string[]
}

interface RestaurantResult {
  id: string
  name: string
  category: string
  link: string | null
  price_range: string | null
  voteCount: number
  voters: string[]
  is_suggestion: boolean
}

export default function LiveResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [keywordResults, setKeywordResults] = useState<KeywordResult[]>([])
  const [restaurantResults, setRestaurantResults] = useState<RestaurantResult[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sessionId) return

    fetchSession()
    fetchKeywordResults()
    fetchRestaurantResults()
    checkIfCreator()

    // Subscribe to real-time updates
    const keywordChannel = supabase
      .channel(`keyword_votes_results_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'keyword_votes',
          filter: `session_id=eq.${sessionId}`
        },
        () => {
          fetchKeywordResults()
        }
      )
      .subscribe()

    const votesChannel = supabase
      .channel(`restaurant_votes_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes'
        },
        () => {
          fetchRestaurantResults()
        }
      )
      .subscribe()

    const sessionChannel = supabase
      .channel(`session_status_${sessionId}`)
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
      supabase.removeChannel(keywordChannel)
      supabase.removeChannel(votesChannel)
      supabase.removeChannel(sessionChannel)
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
    if (!sessionId || !userId) return

    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    if (!userData) return

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('creator_name')
      .eq('id', sessionId)
      .single()

    if (sessionData && userData.name === sessionData.creator_name) {
      setIsCreator(true)
    }
  }

  const fetchKeywordResults = async () => {
    if (!sessionId) return

    const { data: votes } = await supabase
      .from('keyword_votes')
      .select('keyword, users(name)')
      .eq('session_id', sessionId)

    if (votes) {
      // Aggregate by keyword
      const aggregated = votes.reduce((acc, vote) => {
        const keyword = vote.keyword
        const voterName = (vote.users as any)?.name || 'Unknown'

        if (!acc[keyword]) {
          acc[keyword] = {
            keyword,
            voteCount: 0,
            voters: []
          }
        }

        acc[keyword].voteCount++
        acc[keyword].voters.push(voterName)

        return acc
      }, {} as Record<string, KeywordResult>)

      // Sort by vote count
      const sorted = Object.values(aggregated).sort(
        (a, b) => b.voteCount - a.voteCount
      )

      setKeywordResults(sorted)
    }
  }

  const fetchRestaurantResults = async () => {
    if (!sessionId) return

    const { data: places } = await supabase
      .from('places')
      .select('*')
      .eq('session_id', sessionId)

    const { data: votes } = await supabase
      .from('votes')
      .select('place_id, users(name)')

    if (places && votes) {
      // Aggregate votes by place
      const votesByPlace = votes.reduce((acc, vote) => {
        const placeId = vote.place_id
        const voterName = (vote.users as any)?.name || 'Unknown'

        if (!acc[placeId]) {
          acc[placeId] = {
            voteCount: 0,
            voters: []
          }
        }

        acc[placeId].voteCount++
        acc[placeId].voters.push(voterName)

        return acc
      }, {} as Record<string, { voteCount: number, voters: string[] }>)

      // Combine with place data
      const results = places.map(place => ({
        id: place.id,
        name: place.name,
        category: place.category,
        link: place.link,
        price_range: place.price_range,
        is_suggestion: place.is_suggestion,
        voteCount: votesByPlace[place.id]?.voteCount || 0,
        voters: votesByPlace[place.id]?.voters || []
      })).sort((a, b) => b.voteCount - a.voteCount)

      setRestaurantResults(results)
    }
  }

  const handleEndVoting = async () => {
    if (!sessionId) return

    if (!confirm('투표를 종료하시겠습니까? 종료 후에는 더 이상 투표할 수 없습니다.')) {
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          restaurant_voting_active: false,
          voting_phase: 'completed'
        })
        .eq('id', sessionId)

      if (error) throw error

      // Navigate to final result
      if (restaurantResults.length > 0) {
        const winningPlace = restaurantResults[0]
        router.push(`/final-result?sessionId=${sessionId}&placeId=${winningPlace.id}`)
      }
    } catch (err: any) {
      console.error('Error ending voting:', err)
      alert(`종료 실패: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const maxKeywordVotes = keywordResults.length > 0 ? keywordResults[0].voteCount : 1
  const maxRestaurantVotes = restaurantResults.length > 0 ? restaurantResults[0].voteCount : 1

  if (!sessionId) {
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
        <div className="mb-8">
          <h1 className="text-h2 mb-2">실시간 투표 결과</h1>
          {session && (
            <p className="text-body text-text-secondary">
              {session.title}
            </p>
          )}
        </div>

        {/* Keyword Results Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-h3">1차 투표: 키워드 결과</h2>
            {!session?.keyword_voting_active && (
              <Tag className="bg-gray-500 text-white">종료됨</Tag>
            )}
          </div>

          {keywordResults.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">
                아직 키워드 투표가 없습니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {keywordResults.slice(0, 10).map((result, idx) => (
                <Card key={result.keyword}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-h3 text-text-secondary w-8">
                        #{idx + 1}
                      </span>
                      <span className="text-body font-medium">
                        {result.keyword}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-h3 text-primary">{result.voteCount}</div>
                      <div className="text-caption text-text-secondary">표</div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="w-full bg-background rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(result.voteCount / maxKeywordVotes) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  <p className="text-caption text-text-secondary">
                    {result.voters.slice(0, 5).join(', ')}
                    {result.voters.length > 5 && ` 외 ${result.voters.length - 5}명`}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Restaurant Results Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-h3">2차 투표: 음식점 결과</h2>
            {!session?.restaurant_voting_active && (
              <Tag className="bg-gray-500 text-white">종료됨</Tag>
            )}
          </div>

          {restaurantResults.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">
                아직 등록된 음식점이 없습니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {restaurantResults.map((restaurant, idx) => (
                <Card key={restaurant.id} className={idx === 0 && restaurant.voteCount > 0 ? 'border-2 border-primary' : ''}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {idx === 0 && restaurant.voteCount > 0 && (
                          <span className="text-2xl">🏆</span>
                        )}
                        <h3 className="text-h3">{restaurant.name}</h3>
                        {restaurant.is_suggestion && (
                          <Tag className="bg-secondary text-white text-caption">참여자 제안</Tag>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag>{restaurant.category}</Tag>
                        {restaurant.price_range && (
                          <span className="text-caption text-text-secondary">
                            💰 {restaurant.price_range}
                          </span>
                        )}
                      </div>
                      {restaurant.link && (
                        <a
                          href={restaurant.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caption text-primary hover:underline"
                        >
                          🔗 지도에서 보기
                        </a>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-h2 text-primary">{restaurant.voteCount}</div>
                      <div className="text-caption text-text-secondary">표</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-background rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{
                          width: restaurant.voteCount > 0
                            ? `${(restaurant.voteCount / maxRestaurantVotes) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  {restaurant.voters.length > 0 && (
                    <p className="text-caption text-text-secondary">
                      {restaurant.voters.slice(0, 5).join(', ')}
                      {restaurant.voters.length > 5 && ` 외 ${restaurant.voters.length - 5}명`}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Admin Controls */}
        {isCreator && session?.restaurant_voting_active && restaurantResults.length > 0 && (
          <Button
            onClick={handleEndVoting}
            disabled={loading}
            className="w-full"
          >
            {loading ? '처리 중...' : '🔒 투표 종료하고 결과 확정하기'}
          </Button>
        )}

        {!session?.restaurant_voting_active && (
          <div className="bg-primary-light rounded-button p-4 text-center">
            <p className="text-body text-text-primary">
              투표가 종료되었습니다!
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
