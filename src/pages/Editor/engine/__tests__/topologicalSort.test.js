import { describe, it, expect } from 'vitest';
import topologicalSort from '../topologicalSort';

const node = (id) => ({ id });

describe('topologicalSort', () => {
  it('sorts a linear chain in correct order', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
    ];

    const { sorted, hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(false);
    expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
    expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('C'));
  });

  it('sorts a diamond DAG respecting all edges', () => {
    //   A
    //  / \
    // B   C
    //  \ /
    //   D
    const nodes = [node('A'), node('B'), node('C'), node('D')];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'C' },
      { source: 'B', target: 'D' },
      { source: 'C', target: 'D' },
    ];

    const { sorted, hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(false);
    expect(sorted).toHaveLength(4);
    expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
    expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('C'));
    expect(sorted.indexOf('B')).toBeLessThan(sorted.indexOf('D'));
    expect(sorted.indexOf('C')).toBeLessThan(sorted.indexOf('D'));
  });

  it('detects a simple cycle', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'C' },
      { source: 'C', target: 'A' },
    ];

    const { hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(true);
  });

  it('detects a two-node mutual cycle', () => {
    const nodes = [node('A'), node('B')];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'B', target: 'A' },
    ];

    const { hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(true);
  });

  it('handles disconnected nodes (no edges)', () => {
    const nodes = [node('A'), node('B'), node('C')];
    const edges = [];

    const { sorted, hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(false);
    expect(sorted).toHaveLength(3);
    expect(new Set(sorted)).toEqual(new Set(['A', 'B', 'C']));
  });

  it('handles a single node', () => {
    const nodes = [node('X')];
    const edges = [];

    const { sorted, hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(false);
    expect(sorted).toEqual(['X']);
  });

  it('ignores edges referencing non-existent nodes', () => {
    const nodes = [node('A'), node('B')];
    const edges = [
      { source: 'A', target: 'B' },
      { source: 'A', target: 'GHOST' },
    ];

    const { sorted, hasCycle } = topologicalSort(nodes, edges);

    expect(hasCycle).toBe(false);
    expect(sorted).toEqual(['A', 'B']);
  });
});
