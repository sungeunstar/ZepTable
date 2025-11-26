'use client'

import Card from './Card'

export default function SetupGuide() {
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'

  if (isConfigured) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
      <Card className="bg-warning/10 border-2 border-warning">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="text-h3 text-warning mb-2">Supabase 설정이 필요합니다</h3>
            <ol className="text-caption text-text-secondary space-y-2 list-decimal list-inside">
              <li>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase
                </a>
                에서 새 프로젝트 생성
              </li>
              <li>SQL Editor에서 <code className="bg-background px-1 rounded">supabase-schema.sql</code> 실행</li>
              <li>
                <code className="bg-background px-1 rounded">.env.local</code> 파일에 환경 변수 추가:
                <pre className="bg-background p-2 rounded mt-2 text-xs overflow-x-auto">
                  NEXT_PUBLIC_SUPABASE_URL=your_project_url{'\n'}
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
                </pre>
              </li>
              <li>개발 서버 재시작: <code className="bg-background px-1 rounded">npm run dev</code></li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
