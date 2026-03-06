declare module 'd3-voronoi-treemap' {
  import type { HierarchyNode } from 'd3-hierarchy'

  export interface VoronoiTreemapLayout {
    (root: HierarchyNode<unknown>): void
    clip(): [number, number][]
    clip(polygon: [number, number][]): this
    convergenceRatio(): number
    convergenceRatio(ratio: number): this
    maxIterationCount(): number
    maxIterationCount(count: number): this
    minWeightRatio(): number
    minWeightRatio(ratio: number): this
  }

  export function voronoiTreemap(): VoronoiTreemapLayout
}
