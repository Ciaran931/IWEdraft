import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

const Mindmap = dynamic(() => import('./Mindmap'), {
  ssr: false,
  loading: () => (
    <div className="w-full" style={{ aspectRatio: '16/10' }}>
      <Skeleton className="w-full h-full" />
    </div>
  ),
})

export default function MindmapWrapper({
  statusMap,
}: {
  statusMap: Record<string, string>
}) {
  return <Mindmap statusMap={statusMap} />
}
