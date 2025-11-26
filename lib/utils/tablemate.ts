interface User {
  id: string
  name: string
  selected_keywords: string[]
}

interface TablemateMatch {
  userId: string
  name: string
  matchPercentage: number
  commonKeywords: string[]
}

export function calculateTablemates(
  currentUser: User,
  allUsers: User[]
): TablemateMatch[] {
  const matches: TablemateMatch[] = []

  for (const user of allUsers) {
    if (user.id === currentUser.id) continue

    const currentKeywords = new Set(currentUser.selected_keywords)
    const userKeywords = new Set(user.selected_keywords)

    const commonKeywords = [...currentKeywords].filter(k => userKeywords.has(k))
    const allKeywords = new Set([...currentKeywords, ...userKeywords])

    const matchPercentage = allKeywords.size > 0
      ? Math.round((commonKeywords.length / allKeywords.size) * 100)
      : 0

    matches.push({
      userId: user.id,
      name: user.name,
      matchPercentage,
      commonKeywords
    })
  }

  return matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3)
}
