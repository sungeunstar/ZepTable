'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import Tag from '@/components/Tag'
import { supabase } from '@/lib/supabase'
import { defaultKeywords } from '@/lib/defaultKeywords'

export default function CreateSession() {
  const router = useRouter()
  const [creatorName, setCreatorName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalMembers, setTotalMembers] = useState('5')

  // Participant management
  const [participantInput, setParticipantInput] = useState('')
  const [participants, setParticipants] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddParticipant = () => {
    const name = participantInput.trim()
    if (!name) return

    // Check for duplicates (case-insensitive)
    const normalized = name.toLowerCase()
    if (participants.some(p => p.toLowerCase() === normalized)) {
      setError('이미 추가된 참여자입니다')
      return
    }

    setParticipants([...participants, name])
    setParticipantInput('')
    setError('')
  }

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  const handleCreateSession = async () => {
    // Validation
    if (!creatorName.trim()) {
      setError('이름을 입력해주세요')
      return
    }

    if (!title.trim()) {
      setError('모임 이름을 입력해주세요')
      return
    }

    if (participants.length === 0) {
      setError('최소 1명의 참여자를 추가해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          total_members: parseInt(totalMembers),
          voting_active: true,
          voting_phase: 'keyword_voting',
          creator_name: creatorName.trim(),
          keyword_voting_active: true,
          restaurant_voting_active: false
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      if (!sessionData) throw new Error('No session data returned')

      const sessionId = sessionData.id

      // 2. Insert participants
      const participantsData = participants.map(name => ({
        session_id: sessionId,
        name: name.trim(),
        joined: false,
        voted_keywords: false,
        voted_restaurant: false
      }))

      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participantsData)

      if (participantsError) throw participantsError

      // 3. Insert default keywords
      const keywordsData = defaultKeywords.map(keyword => ({
        session_id: sessionId,
        keyword: keyword
      }))

      const { error: keywordsError } = await supabase
        .from('session_keywords')
        .insert(keywordsData)

      if (keywordsError) throw keywordsError

      // 4. Create creator as a user (for voting purposes)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          session_id: sessionId,
          name: creatorName.trim(),
          selected_keywords: []
        })
        .select()
        .single()

      if (userError) throw userError

      // 5. Mark creator as joined in participants
      const { error: joinError } = await supabase
        .from('participants')
        .update({ joined: true })
        .eq('session_id', sessionId)
        .eq('name', creatorName.trim())

      if (joinError) console.warn('Could not mark creator as joined:', joinError)

      // Navigate to share link page
      router.push(`/share-link?sessionId=${sessionId}&creatorName=${encodeURIComponent(creatorName.trim())}&userId=${userData.id}`)
    } catch (err: any) {
      console.error('Error creating session:', err)
      const errorMessage = err?.message || '알 수 없는 오류가 발생했습니다'

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('네트워크 오류: Supabase 연결을 확인해주세요.')
      } else if (errorMessage.includes('JWT') || errorMessage.includes('apikey')) {
        setError('인증 오류: Supabase API 키를 확인해주세요.')
      } else if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        setError('데이터베이스 오류: supabase-migration-v2.sql을 실행해주세요.')
      } else {
        setError(`세션 생성 실패: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-8">
      <Card className="max-w-2xl w-full">
        <h1 className="text-h2 mb-6">새 쩝테이블 만들기</h1>

        <div className="space-y-6">
          {/* Creator Info */}
          <div className="space-y-4">
            <Input
              label="이름 (쩝쩝박사)"
              placeholder="세션 생성자 이름"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />

            <Input
              label="모임 이름"
              placeholder="예: 수요 저녁 모임"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <label className="block text-body mb-2">모임 설명 (선택)</label>
              <textarea
                className="w-full px-4 py-3 border-2 border-surface rounded-button text-body focus:outline-none focus:border-primary resize-none"
                placeholder="예: 일산에서 마지막 만찬"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-caption text-text-secondary mb-2">
                예상 인원 수
              </label>
              <select
                className="w-full px-4 py-3 rounded-button border border-border bg-white text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={totalMembers}
                onChange={(e) => setTotalMembers(e.target.value)}
              >
                {Array.from({ length: 18 }, (_, i) => i + 3).map((num) => (
                  <option key={num} value={num}>
                    {num}명
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Participants Section */}
          <div className="border-t-2 border-surface pt-6">
            <h3 className="text-h3 mb-3">초대할 참여자</h3>
            <p className="text-caption text-text-secondary mb-4">
              참여자 이름을 미리 등록하면, 등록된 사람만 세션에 입장할 수 있습니다.
            </p>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="참여자 이름 입력"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddParticipant()
                  }
                }}
              />
              <Button onClick={handleAddParticipant} variant="secondary">
                추가
              </Button>
            </div>

            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {participants.map((participant, index) => (
                  <Tag
                    key={index}
                    className="flex items-center gap-2 bg-primary-light"
                  >
                    {participant}
                    <button
                      onClick={() => handleRemoveParticipant(index)}
                      className="text-primary hover:text-primary-dark font-bold"
                    >
                      ×
                    </button>
                  </Tag>
                ))}
              </div>
            )}
          </div>

          {/* Keywords Section */}
          <div className="border-t-2 border-surface pt-6">
            <h3 className="text-h3 mb-3">투표 키워드</h3>
            <div className="bg-primary-light rounded-button p-4">
              <p className="text-body text-text-primary mb-2">
                ✨ 기본 키워드가 자동으로 설정됩니다
              </p>
              <p className="text-caption text-text-secondary">
                {defaultKeywords.length}개의 키워드 (음식 카테고리, 맛 스타일, 식사 분위기, 회피 성향 등)가
                세션 생성 시 자동으로 추가되어 참여자들이 투표할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {defaultKeywords.slice(0, 8).map((keyword, index) => (
                  <Tag key={index} className="bg-white text-text-primary">
                    {keyword}
                  </Tag>
                ))}
                <Tag className="bg-white text-text-secondary">
                  +{defaultKeywords.length - 8}개 더
                </Tag>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-button p-3">
              <p className="text-caption text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateSession}
              disabled={loading}
              className="w-full"
            >
              {loading ? '생성 중...' : '쩝테이블 시작하기'}
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
}
