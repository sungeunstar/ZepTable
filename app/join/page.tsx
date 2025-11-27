'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import { supabase } from '@/lib/supabase'
import type { Participant } from '@/lib/supabase'

export default function JoinSession() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionDescription, setSessionDescription] = useState('')

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return

      const { data } = await supabase
        .from('sessions')
        .select('title, description')
        .eq('id', sessionId)
        .single()

      if (data) {
        setSessionTitle(data.title)
        setSessionDescription(data.description || '')
      }
    }

    fetchSession()
  }, [sessionId])

  const normalizeString = (str: string) => {
    return str.trim().toLowerCase()
  }

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요')
      return
    }

    if (!sessionId) {
      setError('유효하지 않은 세션입니다')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Check if name is in the participants list
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)

      if (participantsError) throw participantsError

      if (!participants || participants.length === 0) {
        setError('이 세션에 등록된 참여자가 없습니다')
        setLoading(false)
        return
      }

      // Normalize input name
      const normalizedInput = normalizeString(name)

      // Find matching participant (case-insensitive)
      const matchingParticipant = participants.find(
        (p: Participant) => normalizeString(p.name) === normalizedInput
      )

      if (!matchingParticipant) {
        setError('초대되지 않은 이름입니다. 세션 생성자가 등록한 이름을 입력해주세요.')
        setLoading(false)
        return
      }

      // 2. Check if already joined
      if (matchingParticipant.joined) {
        // If already joined, check if user exists
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('session_id', sessionId)
          .eq('name', matchingParticipant.name)

        if (existingUsers && existingUsers.length > 0) {
          // User already exists, just navigate to voting page
          const userId = existingUsers[0].id

          // Save to localStorage for persistence
          localStorage.setItem('zeptable_auth', JSON.stringify({
            sessionId,
            userId,
            name: matchingParticipant.name,
            participantId: matchingParticipant.id
          }))

          router.push(`/keyword-voting?sessionId=${sessionId}&userId=${userId}`)
          return
        }
      }

      // 3. Create user entry
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          session_id: sessionId,
          name: matchingParticipant.name, // Use the exact name from participants table
          selected_keywords: []
        })
        .select()
        .single()

      if (userError) throw userError

      // 4. Mark participant as joined
      const { error: updateError } = await supabase
        .from('participants')
        .update({ joined: true })
        .eq('id', matchingParticipant.id)

      if (updateError) {
        console.warn('Could not mark participant as joined:', updateError)
      }

      // 5. Save auth info to localStorage
      localStorage.setItem('zeptable_auth', JSON.stringify({
        sessionId,
        userId: userData.id,
        name: matchingParticipant.name,
        participantId: matchingParticipant.id
      }))

      // 6. Navigate to keyword voting page
      router.push(`/keyword-voting?sessionId=${sessionId}&userId=${userData.id}`)
    } catch (err) {
      console.error('Error joining session:', err)
      setError('참여에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

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
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h1 className="text-h2 mb-2">쩝테이블 참여하기</h1>
        {sessionTitle && (
          <div className="mb-6">
            <p className="text-body text-text-primary font-medium">
              &quot;{sessionTitle}&quot;
            </p>
            {sessionDescription && (
              <p className="text-caption text-text-secondary mt-1">
                {sessionDescription}
              </p>
            )}
          </div>
        )}

        <div className="bg-primary-light rounded-button p-4 mb-6">
          <p className="text-caption text-text-secondary">
            💡 세션 생성자가 등록한 참여자만 입장할 수 있습니다.
            등록된 이름을 정확히 입력해주세요.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="이름"
            placeholder="등록된 이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleJoin()
              }
            }}
          />

          <Button
            onClick={handleJoin}
            disabled={loading}
            className="w-full"
          >
            {loading ? '확인 중...' : '참여하기'}
          </Button>
        </div>
      </Card>
    </main>
  )
}
