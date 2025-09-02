import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/KanbanBoard'

export default function Home() {
  // In a real app, you'd check authentication here
  // For now, redirect to the demo board
  return redirect('/boards/507f1f77bcf86cd799439012')
}
