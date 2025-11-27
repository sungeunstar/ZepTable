'use client'


import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import { supabase } from '@/lib/supabase'

export default function JoinSession() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('sessionId')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionTitle, setSessionTitle] = useState('')

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return

      const { data } = await supabase
        .from('sessions')
        .select('title')
        .eq('id', sessionId)
        .single()

      if (data) {
        setSessionTitle(data.title)
      }
    }

    fetchSession()
  }, [sessionId])

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
      const { data, error: insertError } = await supabase
        .from('users')
        .insert({
          session_id: sessionId,
          name: name.trim(),
          selected_keywords: []
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/keyword-voting?sessionId=${sessionId}&userId=${data.id}`)
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
          <p className="text-body text-text-secondary mb-6">
            &quot;{sessionTitle}&quot; 모임
          </p>
        )}

        <div className="space-y-4">
          <Input
            label="이름"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />

          <Button
            onClick={handleJoin}
            disabled={loading}
            className="w-full"
          >
            {loading ? '참여 중...' : '참여하기'}
          </Button>
        </div>
      </Card>
    </main>
  )
}
