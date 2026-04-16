import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

// 面试官您好，我是基于 双栈模型 + 状态快照 实现的撤销重做功能，整体封装成了 React 自定义 Hook，核心逻辑是：
// 1.用 历史栈-past 存储 “历史快照”，重做栈-future 存储 被撤销的“重做快照”，均遵循后进先出的规则；
// 2.用户每次操作后，用 深拷贝 生成当前状态的 快照 存入 历史栈，同时清空 重做栈；
// 3.撤销 (undo) 时：把当前状态存入 重做栈，从 历史栈 栈顶取出上一状态进行恢复；重做 (redo) 则是完全镜像的反向操作；
// 4.适配 React 的异步更新和闭包特性，用 useRef 做 跳过标记，避免无效快照，用函数式更新保证状态准确性，同时做了内存上限控制和边界兜底。

export default function useUndoRedo(initialNodes = [], initialEdges = []) {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const skipNextRef = useRef(false);

  const takeSnapshot = useCallback((nodes, edges) => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    setPast((prev) => { // 函数式更新，拿到最新前置状态
      const next = [...prev, { nodes: structuredClone(nodes), edges: structuredClone(edges) }];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setFuture([]);
  }, []);

  const undo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
    if (past.length === 0) return;
    const previous = past[past.length - 1]; // S1

    // 保存 “现状” 到 重做栈：S2
    setFuture((prev) => [
      ...prev,
      { nodes: structuredClone(currentNodes), edges: structuredClone(currentEdges) },
    ]);

    // 伸手去左边 历史栈，把最上面那张照片拿开（扔掉），剩下：S0
    setPast((prev) => prev.slice(0, -1)); 

    skipNextRef.current = true;

    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past]);

  const redo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
    if (future.length === 0) return;
    const next = future[future.length - 1];

    // 同上，把 currentNodes: S1 重新塞回 past，以便下次撤销时还能回来
    setPast((prev) => [
      ...prev,
      { nodes: structuredClone(currentNodes), edges: structuredClone(currentEdges) },
    ]);
    
    // 同上，扔掉最上层的 S2，因为我们马上就用掉它了
    setFuture((prev) => prev.slice(0, -1));

    skipNextRef.current = true;
    
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future]);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

// 追问 2：为什么用 useRef 存 skipNextRef，不用 useState？
// 答：核心是两个特性匹配：
// ● useRef 的 current 值 修改 是同步且可变的，不会触发 组件重渲染
// useRef 适合存储一个在渲染间 持久存在 的 可变值，如 DOM、timer、中间值，而 useState 适合存储界面需要展示的数据
// ● useRef 是 同一个对象 贯穿组件 全生命周期，存的值永远最新，不会被闭包锁住，能在 useCallback 缓存的函数里稳定读取，不需要依赖，不会造成重复创建，是做标记、存最新值的最佳选择

// 追问 3：如果状态数据量特别大，深拷贝有性能问题，你会怎么优化？
// 答：我会从 3 个维度做优化，按优先级排序：
// ● 快照合并 (Debounce)：比如拖拽节点、连续输入这类高频操作，不每帧都生成快照，只在操作结束（比如onPointerUp、onChangeComplete）时生成一个快照，减少快照数量；
// ● 增量快照（写时复制）：不再全量深拷贝，只记录变化的部分。比如用 Immutable.js/Immer.js (Proxy 监听) 实现不可变数据，每次快照只保存变化的节点引用，复用未变化的部分，大幅减少内存占用和拷贝开销；
// ● 快照压缩 / 持久化：如果历史步数要求极高，可把非活跃的快照序列化后存入 IndexedDB (浏览器原生提供的异步本地 NoSQL 数据库)，需要时再读取，避免占用主线程内存。

// 追问 4：怎么实现批量操作合并成一个历史步骤？比如连续输入多个字符，撤销时一次性撤回整段输入。
// 答：核心是给快照增加批次标识和合并开关，实现方案如下：
// ● 给 takeSnapshot 增加一个可选参数 mergeKey，相同 mergeKey 的操作会被合并为同一个历史步骤；
// ● 开启合并时，新的快照不会新增历史记录，而是直接替换历史栈的栈顶快照，同时不清空重做栈；
// ● 操作结束时，关闭合并开关，后续新操作会正常生成新快照。
// 比如连续输入场景，输入聚焦时设置 mergeKey="input"，失焦时清空 mergeKey，这样整个输入过程只会生成一个历史快照，撤销时一次性撤回。