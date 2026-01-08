'use client'

import Navbar from '@/components/Navbar'
import { KanbanBoard } from '@/components/KanbanBoard'

interface BoardPageProps {
  params: {
    boardId: string
  }
}

export default function BoardPage({ params }: BoardPageProps) {
  return (
    <div>
      <Navbar />
      <KanbanBoard boardId={params.boardId} />
    </div>
  )
}
