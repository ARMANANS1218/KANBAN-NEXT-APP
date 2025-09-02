'use client'

import { KanbanBoard } from '@/components/KanbanBoard'

interface BoardPageProps {
  params: {
    boardId: string
  }
}

export default function BoardPage({ params }: BoardPageProps) {
  return <KanbanBoard boardId={params.boardId} />
}
