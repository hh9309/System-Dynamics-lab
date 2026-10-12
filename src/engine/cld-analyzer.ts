/**
 * Causal Loop Diagram (CLD) Topology Analyzer
 * Detects feedback cycles, computes loop polarity (Reinforcing R vs Balancing B),
 * and analyzes information delays and system stability.
 */

import { CldNode, CldLink, CldLoop } from '../types/system-dynamics';

export interface DetectedLoop {
  id: string;
  type: 'R' | 'B';
  nodes: string[];
  linkIds: string[];
  hasDelay: boolean;
  polarityReason: string;
}

export class CldAnalyzer {
  /**
   * Find all simple directed cycles in the graph (up to max length 8 to avoid factorial explosion)
   */
  static detectFeedbackLoops(nodes: CldNode[], links: CldLink[]): DetectedLoop[] {
    const adj: Map<string, { target: string; linkId: string; polarity: '+' | '-'; delay: boolean }[]> = new Map();

    for (const n of nodes) {
      adj.set(n.id, []);
    }

    for (const l of links) {
      if (adj.has(l.source)) {
        adj.get(l.source)!.push({
          target: l.target,
          linkId: l.id,
          polarity: l.polarity,
          delay: l.delay,
        });
      }
    }

    const detectedLoops: DetectedLoop[] = [];
    const visitedPaths: Set<string> = new Set();

    // Helper to canonically normalize loop cycle to avoid duplicates
    const canonicalKey = (path: string[]): string => {
      let minIdx = 0;
      for (let i = 1; i < path.length; i++) {
        if (path[i] < path[minIdx]) minIdx = i;
      }
      const rotated = [...path.slice(minIdx), ...path.slice(0, minIdx)];
      return rotated.join('->');
    };

    const dfs = (
      current: string,
      start: string,
      path: string[],
      currentLinks: string[],
      negativeCount: number,
      hasDelay: boolean
    ) => {
      if (path.length > 8) return; // limit depth

      const neighbors = adj.get(current) || [];
      for (const edge of neighbors) {
        if (edge.target === start && path.length >= 2) {
          // Closed cycle!
          const cycleNodes = [...path];
          const cycleKey = canonicalKey(cycleNodes);

          if (!visitedPaths.has(cycleKey)) {
            visitedPaths.add(cycleKey);
            const totalNegatives = negativeCount + (edge.polarity === '-' ? 1 : 0);
            const isBalancing = totalNegatives % 2 === 1;
            const loopType = isBalancing ? 'B' : 'R';
            const allLinks = [...currentLinks, edge.linkId];
            const cycleDelay = hasDelay || edge.delay;

            detectedLoops.push({
              id: `loop-${detectedLoops.length + 1}`,
              type: loopType,
              nodes: cycleNodes,
              linkIds: allLinks,
              hasDelay: cycleDelay,
              polarityReason: `包含 ${totalNegatives} 个负反馈连接，极性为 ${
                isBalancing ? '负反馈调节 (B)' : '正反馈增强 (R)'
              }`,
            });
          }
        } else if (!path.includes(edge.target)) {
          dfs(
            edge.target,
            start,
            [...path, edge.target],
            [...currentLinks, edge.linkId],
            negativeCount + (edge.polarity === '-' ? 1 : 0),
            hasDelay || edge.delay
          );
        }
      }
    };

    for (const node of nodes) {
      dfs(node.id, node.id, [node.id], [], 0, false);
    }

    return detectedLoops;
  }
}
