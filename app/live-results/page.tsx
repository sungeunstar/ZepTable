'use client'


import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import { supabase } from '@/lib/supabase'
import { calculateTablemates } from '@/lib/utils/tablemate'

interface Place {
  id: string
  name: string
  category: string
  keywords: string[]
  voteCount: number
}

interface User {
  id: string
  name: string
  selected_keywords: string[]
}

interface Tablemate {
  name: string
  matchPercentage: number
  commonKeywords: string[]
}

export default function LiveResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const [places, setPlaces] = useState<Place[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tablemates, setTablemates] = useState<Tablemate[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    if (!sessionId) return

    fetchResults()

    const votesSubscription = supabase
      .channel('votes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          fetchResults()
        }
      )
      .subscribe()

    const usersSubscription = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchResults()
        }
      )
      .subscribe()

    return () => {
      votesSubscription.unsubscribe()
      usersSubscription.unsubscribe()
    }
  }, [sessionId])

  useEffect(() => {
    if (userId && users.length > 0) {
      const user = users.find(u => u.id === userId)
      if (user) {
        setCurrentUser(user)
        const matches = calculateTablemates(user, users)
        setTablemates(matches)
      }
    }
  }, [userId, users])

  const fetchResults = async () => {
    if (!sessionId) return

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionData) {
      setSessionInfo(sessionData)
    }

    const { data: placesData } = await supabase
      .from('places')
      .select('*')
      .eq('session_id', sessionId)

    const { data: votesData } = await supabase
      .from('votes')
      .select('place_id')

    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .eq('session_id', sessionId)

    if (usersData) {
      setUsers(usersData)
    }

    if (placesData && votesData) {
      const voteCounts = votesData.reduce((acc, vote) => {
        acc[vote.place_id] = (acc[vote.place_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const placesWithVotes = placesData.map(place => ({
        ...place,
        voteCount: voteCounts[place.id] || 0
      })).sort((a, b) => b.voteCount - a.voteCount)

      setPlaces(placesWithVotes)
    }
  }

  const handleFinishVoting = () => {
    if (places.length > 0) {
      const winningPlace = places[0]
      router.push(`/final-result?sessionId=${sessionId}&placeId=${winningPlace.id}`)
    }
  }

  const maxVotes = places.length > 0 ? places[0].voteCount : 0

  return (
    <main className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-h2 mb-2">실시간 투표 결과</h1>
          {sessionInfo && (
            <p className="text-body text-text-secondary">
              {sessionInfo.title} - 참여자 {users.length}명 / 예상 {sessionInfo.total_members}명
            </p>
          )}
        </div>

        {currentUser && tablemates.length > 0 && (
          <Card className="mb-8 bg-primary-light">
            <h2 className="text-h3 mb-4">당신과 상성이 높은 테이블메이트 🤝</h2>
            <div className="space-y-3">
              {tablemates.map((mate, idx) => (
                <div key={idx} className="bg-white p-4 rounded-button">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-body font-semibold">{mate.name}</span>
                    <Tag variant="success">{mate.matchPercentage}% 일치</Tag>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mate.commonKeywords.map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="text-caption text-text-secondary bg-background px-2 py-1 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-4 mb-8">
          {places.length === 0 ? (
            <Card>
              <p className="text-text-secondary text-center">
                아직 투표된 장소가 없습니다.
              </p>
            </Card>
          ) : (
            places.map((place, idx) => (
              <Card key={place.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {idx === 0 && maxVotes > 0 && (
                        <span className="text-2xl">🏆</span>
                      )}
                      <h3 className="text-h3">{place.name}</h3>
                    </div>
                    <Tag>{place.category}</Tag>
                  </div>
                  <div className="text-right">
                    <div className="text-h2 text-primary">{place.voteCount}</div>
                    <div className="text-caption text-text-secondary">표</div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-background rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{
                        width: maxVotes > 0 ? `${(place.voteCount / maxVotes) * 100}%` : '0%'
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {place.keywords.map((keyword, kidx) => (
                    <span
                      key={kidx}
                      className="text-caption text-text-secondary bg-background px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        {places.length > 0 && (
          <Button onClick={handleFinishVoting} className="w-full">
            투표 종료하고 결과 확정하기
          </Button>
        )}
      </div>
    </main>
  )
}
