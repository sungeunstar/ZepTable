'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Card from '@/components/Card'
import { supabase } from '@/lib/supabase'

export default function CreateSession() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [totalMembers, setTotalMembers] = useState('5')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateSession = async () => {
    if (!title.trim()) {
      setError('모임 이름을 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert({
          title: title.trim(),
          total_members: parseInt(totalMembers),
          voting_active: true
        })
        .select()
        .single()

      if (insertError) {
        console.error('Supabase error:', insertError)
        throw insertError
      }

      if (!data) {
        throw new Error('No data returned from insert')
      }

      router.push(`/share-link?sessionId=${data.id}`)
    } catch (err: any) {
      console.error('Error creating session:', err)
      const errorMessage = err?.message || '알 수 없는 오류가 발생했습니다'

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setError('네트워크 오류: Supabase 연결을 확인해주세요.')
      } else if (errorMessage.includes('JWT') || errorMessage.includes('apikey')) {
        setError('인증 오류: Supabase API 키를 확인해주세요.')
      } else if (errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        setError('데이터베이스 오류: 테이블이 생성되지 않았습니다. supabase-schema.sql을 실행해주세요.')
      } else {
        setError(`세션 생성 실패: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <h1 className="text-h2 mb-6">새 쩝테이블 만들기</h1>

        <div className="space-y-4">
          <Input
            label="모임 이름"
            placeholder="예: 수요 저녁 모임"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={error}
          />

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
