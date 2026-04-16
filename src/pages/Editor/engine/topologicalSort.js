/**
 * Kahn's algorithm for topological sort.
 * Returns { sorted, hasCycle }.
 * sorted: array of node IDs in execution order.
 */

// 拓扑排序 是对 DAG（有向无环图）的节点进行排序的算法
// 使得对于图中任意一条有向边 u→v，节点 u 一定排在节点 v 的前面

// 算法核心思想：依赖拆除
// 1.初始化入度与队列
// ● 在构建图时，统计每个任务的 入度（前置任务数量）与 后继任务。
// ● 将入度为 0 的任务加入“可执行队列”。

// 2.循环处理队列
// ● 拆一个任务：从队列取出一个任务，加入 “排序结果队列”。
// ● 拆依赖：将该任务的 所有后继任务 的 入度 减 1。
// ● 释放新任务：若某个后继任务的入度减到 0，加入队列。

// 3.检查结果
// ● 若排序结果队列包含所有任务（队列「节点数量」=== 图的「节点数量」）→ 成功排序。
// ● 若排序结果队列不完整 → 图中存在环（互相依赖，无法执行）。

export default function topologicalSort(nodes, edges) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  // 入度表：记录 有向图 中，每个节点的「入度（In-Degree）」
  // 指所有 直接指向 该节点的 有向边 的数量
  const inDegree = new Map();

  // 邻接表：存储 图结构（尤其是有向图）的一种高效数据结构
  // 核心是用「键值对」的形式，记录每个节点对应的所有 直接后继节点
  const adjacency = new Map();

  // 1.初始化
  for (const id of nodeIds) {
    inDegree.set(id, 0);
    adjacency.set(id, []);
  }

  // 2.构建图
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source).push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // 3.拓扑排序
  // 3.1 初始化队列，将所有入度为 0 的节点加入队列
  const queue = [];
  for (const [id, deg] of inDegree) { // [key, value]
    if (deg === 0) queue.push(id);
  }

  // 3.2 循环处理队列，将队列中的节点加入排序结果中，减少其所有后继节点的入度，若后继节点入度变为 0 则入队
  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);
    for (const neighbor of adjacency.get(current) || []) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // 4.环检测
  // 如果排序结果中的「节点数量」不等于图中的「节点数量」，则存在环路
  const hasCycle = sorted.length !== nodeIds.size;
  return { sorted, hasCycle };
}
