'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { voronoiTreemap } from 'd3-voronoi-treemap'
import { getHierarchyData, getFlatLessons } from '@/lib/grammar-tree'
import { useRouter } from 'next/navigation'

const COLORS = {
  grey: '#D0D0D0',
  orange: '#E8A850',
  green: '#6BBF6B',
}

interface Props {
  statusMap: Record<string, string>
}

export default function Mindmap({ statusMap }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const router = useRouter()

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const width = svg.clientWidth || 700
    const height = Math.max(400, width * 0.6)
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    // Clear previous render
    d3.select(svg).selectAll('*').remove()

    const flatLessons = getFlatLessons()
    const hierarchyData = getHierarchyData()

    const root = d3
      .hierarchy(hierarchyData)
      .sum(() => 1)

    const clip: [number, number][] = [
      [0, 0],
      [0, height],
      [width, height],
      [width, 0],
    ]

    const layout = voronoiTreemap().clip(clip)
    layout(root as unknown as Parameters<typeof layout>[0])

    const g = d3.select(svg).append('g')

    const leaves = (root.leaves() as unknown) as Array<d3.HierarchyNode<{ id: string; label: string; value: number }> & { polygon: [number, number][] }>

    leaves.forEach(leaf => {
      if (!leaf.polygon) return

      const lessonId = leaf.data.id
      const status = statusMap[lessonId]
      const fill = status === 'mature' ? COLORS.green : status ? COLORS.orange : COLORS.grey

      const pathData = 'M' + leaf.polygon.map(p => p.join(',')).join('L') + 'Z'
      const centroid = d3.polygonCentroid(leaf.polygon)
      const area = Math.abs(d3.polygonArea(leaf.polygon))
      const fontSize = Math.max(7, Math.min(11, Math.sqrt(area) / 6))

      const cell = g.append('g').style('cursor', 'pointer')

      cell
        .append('path')
        .attr('d', pathData)
        .attr('fill', fill)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mouseover', function () {
          d3.select(this).attr('filter', 'brightness(1.1)')
        })
        .on('mouseout', function () {
          d3.select(this).attr('filter', '')
        })

      const label = flatLessons.find(l => l.id === lessonId)?.label ?? lessonId
      const words = label.split(/\s+/)
      const maxCharsPerLine = Math.max(8, Math.sqrt(area) / 5)
      const lines: string[] = []
      let currentLine = ''
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length > maxCharsPerLine && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = (currentLine + ' ' + word).trim()
        }
      }
      if (currentLine) lines.push(currentLine)

      const textEl = cell
        .append('text')
        .attr('x', centroid[0])
        .attr('y', centroid[1] - ((lines.length - 1) * fontSize * 0.6))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#2C2C2C')
        .attr('font-size', fontSize)
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .style('pointer-events', 'none')
        .style('user-select', 'none')

      lines.forEach((line, i) => {
        textEl
          .append('tspan')
          .attr('x', centroid[0])
          .attr('dy', i === 0 ? 0 : fontSize * 1.2)
          .text(line)
      })

      cell.on('click', () => {
        router.push(`/grammar/${lessonId}`)
      })
    })
  }, [statusMap, router])

  return (
    <div className="w-full overflow-x-auto" style={{ minWidth: 300 }}>
      <svg
        ref={svgRef}
        className="w-full"
        style={{ minWidth: 600, height: 'auto', aspectRatio: '16/10' }}
      />
    </div>
  )
}
