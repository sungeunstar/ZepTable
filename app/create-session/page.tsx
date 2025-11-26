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

      if (insertError) throw insertError

      router.push(`/share-link?sessionId=${data.id}`)
    } catch (err) {
      console.error('Error creating session:', err)
      setError('세션 생성에 실패했습니다. 다시 시도해주세요.')
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
