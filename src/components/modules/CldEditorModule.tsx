/**
 * Module 2: 因果回路图 (CLD) 交互编辑器
 * Spacious widescreen layout, interactive delay "//" explanation drawer,
 * zoom/pan controls, cycle feedback loops detection, and path highlighting.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Share2,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  Trash2,
  HelpCircle,
  Eye,
  Check,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
} from 'lucide-react';
import { SystemModel, CldNode, CldLink, VariableType } from '../../types/system-dynamics';
import { CldAnalyzer, DetectedLoop } from '../../engine/cld-analyzer';
import { MathText, KatexMath } from '../common/KatexMath';

interface CldEditorModuleProps {
  model: SystemModel;
  onUpdateModelCld?: (nodes: CldNode[], links: CldLink[]) => void;
}

export const CldEditorModule: React.FC<CldEditorModuleProps> = ({ model }) => {
  // Local state for interactive editing
  const [nodes, setNodes] = useState<CldNode[]>(model.cldNodes);
  const [links, setLinks] = useState<CldLink[]>(model.cldLinks);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeHoverLoop, setActiveHoverLoop] = useState<DetectedLoop | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layout View Mode: 'spacious' (full width canvas) vs 'split' (side by side)
  const [isSpaciousMode, setIsSpaciousMode] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Delay "//" Educational Explainer Modal/Drawer
  const [showDelayExplainer, setShowDelayExplainer] = useState<boolean>(false);
  const [selectedDelayLink, setSelectedDelayLink] = useState<CldLink | null>(null);

  // Adding new node modal / form
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<VariableType>('auxiliary');

  // Adding new link form
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkSource, setLinkSource] = useState('');
  const [linkTarget, setLinkTarget] = useState('');
  const [linkPolarity, setLinkPolarity] = useState<'+' | '-'>('+');
  const [linkDelay, setLinkDelay] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Canvas bounds (Spacious coordinate frame)
  const CANVAS_WIDTH = 1120;
  const CANVAS_HEIGHT = 640;

  // Sync when model changes
  useEffect(() => {
    setNodes(model.cldNodes);
    setLinks(model.cldLinks);
    setSelectedNodeId(null);
    setActiveHoverLoop(null);
    setSelectedDelayLink(null);
  }, [model.id, model.cldNodes, model.cldLinks]);

  // Detected loops
  const detectedLoops = useMemo(() => {
    return CldAnalyzer.detectFeedbackLoops(nodes, links);
  }, [nodes, links]);

  // Mouse handlers for dragging nodes
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const mouseSvgX = (e.clientX - rect.left) * scaleX;
    const mouseSvgY = (e.clientY - rect.top) * scaleY;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseSvgX - node.x,
      y: mouseSvgY - node.y,
    });
    setSelectedNodeId(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const mouseSvgX = (e.clientX - rect.left) * scaleX;
    const mouseSvgY = (e.clientY - rect.top) * scaleY;

    const newX = Math.max(60, Math.min(CANVAS_WIDTH - 60, mouseSvgX - dragOffset.x));
    const newY = Math.max(50, Math.min(CANVAS_HEIGHT - 50, mouseSvgY - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Node Map for fast coordinate lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, CldNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Add Node Handler
  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const id = `node_${Date.now()}`;
    const newNode: CldNode = {
      id,
      name: newNodeName.trim(),
      type: newNodeType,
      x: 480 + (Math.random() - 0.5) * 160,
      y: 280 + (Math.random() - 0.5) * 160,
    };
    setNodes((prev) => [...prev, newNode]);
    setNewNodeName('');
    setShowAddNode(false);
  };

  // Add Link Handler
  const handleAddLink = () => {
    if (!linkSource || !linkTarget || linkSource === linkTarget) return;
    const id = `link_${Date.now()}`;
    const newLink: CldLink = {
      id,
      source: linkSource,
      target: linkTarget,
      polarity: linkPolarity,
      delay: linkDelay,
    };
    setLinks((prev) => [...prev, newLink]);
    setShowAddLink(false);
  };

  // Nudge selected node by delta pixels
  const handleNudgeNode = (dx: number, dy: number) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              x: Math.max(60, Math.min(CANVAS_WIDTH - 60, n.x + dx)),
              y: Math.max(50, Math.min(CANVAS_HEIGHT - 50, n.y + dy)),
            }
          : n
      )
    );
  };

  // Keyboard arrow listeners for precision nudging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return;
      // Don't intercept if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const step = e.shiftKey ? 38 : 5; // Shift moves ~1 cm (38px), regular moves 5px
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNudgeNode(-step, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNudgeNode(step, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleNudgeNode(0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNudgeNode(0, step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  // Delete selected node
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setLinks((prev) => prev.filter((l) => l.source !== id && l.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Reset to original preset
  const handleReset = () => {
    setNodes(model.cldNodes);
    setLinks(model.cldLinks);
    setSelectedNodeId(null);
    setActiveHoverLoop(null);
    setSelectedDelayLink(null);
    setZoomLevel(1.0);
  };

  // Spacious distribution auto-arranger
  const handleAutoSpread = () => {
    const count = nodes.length;
    if (count === 0) return;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const radiusX = 360;
    const radiusY = 200;

    setNodes((prev) =>
      prev.map((n, i) => {
        const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        return {
          ...n,
          x: Math.round(centerX + Math.cos(angle) * radiusX),
          y: Math.round(centerY + Math.sin(angle) * radiusY),
        };
      })
    );
  };

  // Calculate curved path for causal links with ample arc headroom
  const renderLink = (link: CldLink) => {
    const src = nodeMap.get(link.source);
    const tgt = nodeMap.get(link.target);
    if (!src || !tgt) return null;

    const isHighlightedInLoop = activeHoverLoop && activeHoverLoop.linkIds.includes(link.id);

    // Vector calculations
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return null;

    // Normal vector for curved arc
    const nx = -dy / dist;
    const ny = dx / dist;

    // Responsive spacious curvature (proportional to distance)
    const curvature = Math.max(28, Math.min(54, dist * 0.16));
    const midX = (src.x + tgt.x) / 2 + nx * curvature;
    const midY = (src.y + tgt.y) / 2 + ny * curvature;

    // Node clearance buffer (prevents arrows from piercing the node boxes)
    const nodeRadius = 58;
    const startX = src.x + (dx / dist) * (nodeRadius * 0.82);
    const startY = src.y + (dy / dist) * (nodeRadius * 0.82);
    const endX = tgt.x - (dx / dist) * (nodeRadius * 0.86);
    const endY = tgt.y - (dy / dist) * (nodeRadius * 0.86);

    const pathData = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;

    const strokeColor = isHighlightedInLoop
      ? activeHoverLoop?.type === 'R'
        ? '#ea580c'
        : '#0284c7'
      : link.polarity === '+'
      ? '#2563eb'
      : '#dc2626';

    // Delay marker position offset slightly along tangent so it doesn't collide with the polarity circle
    const delayOffsetDist = 26;
    const delayX = midX + (dx / dist) * delayOffsetDist + nx * 4;
    const delayY = midY + (dy / dist) * delayOffsetDist + ny * 4;

    return (
      <g key={link.id} className="transition-all duration-150">
        {/* Invisible wider stroke for easy click */}
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          strokeWidth="20"
          className="cursor-pointer"
          onClick={() => {
            // Toggle polarity on click
            setLinks((prev) =>
              prev.map((l) => (l.id === link.id ? { ...l, polarity: l.polarity === '+' ? '-' : '+' } : l))
            );
          }}
        />

        {/* Causal arrow line (Dashed if link has delay) */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={isHighlightedInLoop ? 3.4 : 2.2}
          strokeDasharray={link.delay ? '8 4' : undefined}
          markerEnd={
            isHighlightedInLoop
              ? `url(#arrow-head-highlight-${activeHoverLoop?.type})`
              : `url(#arrow-head-${link.polarity === '+' ? 'plus' : 'minus'})`
          }
        />

        {/* Polarity Badge Circle (+ / -) */}
        <g
          transform={`translate(${midX}, ${midY})`}
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            setLinks((prev) =>
              prev.map((l) => (l.id === link.id ? { ...l, polarity: l.polarity === '+' ? '-' : '+' } : l))
            );
          }}
        >
          <circle
            cx="0"
            cy="0"
            r="12"
            fill="#ffffff"
            stroke={strokeColor}
            strokeWidth="2.0"
            className="shadow-sm group-hover:scale-110 transition-transform"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill={strokeColor}
            className="text-[13px] font-bold font-mono select-none pointer-events-none"
          >
            {link.polarity}
          </text>
        </g>

        {/* Delay Marker: Double Hash // (Clickable to open delay explainer) */}
        {link.delay && (
          <g
            transform={`translate(${delayX}, ${delayY})`}
            className="cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDelayLink(link);
              setShowDelayExplainer(true);
            }}
          >
            <rect
              x="-14"
              y="-10"
              width="28"
              height="20"
              rx="4"
              fill="#ffffff"
              stroke="#d97706"
              strokeWidth="1.6"
              className="shadow-xs group-hover:scale-110 group-hover:stroke-amber-700 transition-all"
            />
            <text
              x="0"
              y="4.5"
              textAnchor="middle"
              className="text-[11px] font-mono font-extrabold fill-amber-800 tracking-wider pointer-events-none select-none"
            >
              //
            </text>
            {/* Small delay hover label */}
            <title>点击查看：系统动力学「// 延迟 (Delay)」的学术机理</title>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-5">
      {/* Module Title & Toolbar */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-teal-700" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              因果回路图交互编辑器 (CLD Editor)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-mono border border-teal-200 font-medium">
              识别回路: {detectedLoops.length} 个
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            拖动节点自由布局 · 点击因果连线 (+/-) 切换极性 · 自动识别闭环反馈回路 (R/B)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddNode(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition-colors cursor-pointer font-medium shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加变量</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddLink(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer font-medium"
          >
            <Zap className="w-3.5 h-3.5 text-stone-600" />
            <span>添加因果链</span>
          </button>

          <button
            type="button"
            onClick={handleAutoSpread}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title="一键舒展环形排布"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">舒展重排</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title="复位默认拓扑"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas & Loop Detection Layout */}
      <div className={`grid gap-6 ${isSpaciousMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {/* SVG Interactive Canvas */}
        <div className={`${isSpaciousMode ? 'w-full' : 'lg:col-span-3'} bg-white rounded-xl border border-stone-200/90 shadow-xs p-4 flex flex-col relative select-none`}>
          {/* Canvas Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs text-stone-500 font-mono border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-700">画布尺寸: {CANVAS_WIDTH} x {CANVAS_HEIGHT} px</span>
              <span className="text-stone-300">|</span>
              <span className="text-teal-700 font-medium">缩放: {(zoomLevel * 100).toFixed(0)}%</span>
            </div>

            {/* Legend indicators */}
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span className="text-stone-700">+ 同向因果</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                <span className="text-stone-700">- 反向调节</span>
              </span>
              <span className="flex items-center gap-1 font-mono text-amber-800">
                <span className="font-bold">//</span>
                <span className="font-sans text-stone-600">时滞 (Delay)</span>
              </span>

              {/* Zoom In / Out Controls */}
              <div className="flex items-center gap-1 pl-2 border-l border-stone-200">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                  className="p-1 rounded hover:bg-stone-100 text-stone-600 cursor-pointer"
                  title="缩小视野"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className="px-1.5 py-0.5 rounded hover:bg-stone-100 text-[10px] text-stone-600 cursor-pointer"
                  title="重置缩放"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
                  className="p-1 rounded hover:bg-stone-100 text-stone-600 cursor-pointer"
                  title="放大视野"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* SVG Frame with wide viewport */}
          <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-stone-50/60 relative shadow-inner">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              className="w-full h-auto cursor-default transition-transform duration-100"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Arrow Markers Definitions */}
              <defs>
                <marker
                  id="arrow-head-plus"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="4.5"
                  orient="auto"
                >
                  <polygon points="0 1, 8 4.5, 0 8" fill="#2563eb" />
                </marker>
                <marker
                  id="arrow-head-minus"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="4.5"
                  orient="auto"
                >
                  <polygon points="0 1, 8 4.5, 0 8" fill="#dc2626" />
                </marker>
                <marker
                  id="arrow-head-highlight-R"
                  markerWidth="11"
                  markerHeight="11"
                  refX="8.5"
                  refY="5"
                  orient="auto"
                >
                  <polygon points="0 1.5, 9 5, 0 8.5" fill="#ea580c" />
                </marker>
                <marker
                  id="arrow-head-highlight-B"
                  markerWidth="11"
                  markerHeight="11"
                  refX="8.5"
                  refY="5"
                  orient="auto"
                >
                  <polygon points="0 1.5, 9 5, 0 8.5" fill="#0284c7" />
                </marker>
              </defs>

              {/* Grid Background Lines (subtle scholarly laboratory grid) */}
              <g opacity="0.35">
                {Array.from({ length: 11 }).map((_, i) => (
                  <line
                    key={`vg-${i}`}
                    x1={i * 106}
                    y1="0"
                    x2={i * 106}
                    y2={CANVAS_HEIGHT}
                    stroke="#e7e5e4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <line
                    key={`hg-${i}`}
                    x1="0"
                    y1={i * 103}
                    x2={CANVAS_WIDTH}
                    y2={i * 103}
                    stroke="#e7e5e4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}
              </g>

              {/* Render Links */}
              {links.map(renderLink)}

              {/* Render Nodes with generous padding & readable typography */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isInHoverLoop = activeHoverLoop && activeHoverLoop.nodes.includes(node.id);

                let fillBg = '#ffffff';
                let strokeColor = '#78716c';

                if (node.type === 'stock') {
                  strokeColor = '#0d9488';
                } else if (node.type === 'flow') {
                  strokeColor = '#0284c7';
                }

                if (isInHoverLoop) {
                  strokeColor = activeHoverLoop?.type === 'R' ? '#ea580c' : '#0284c7';
                  fillBg = activeHoverLoop?.type === 'R' ? '#fff7ed' : '#f0f9ff';
                } else if (isSelected) {
                  fillBg = '#f5f5f4';
                }

                // Node box size: 124px x 46px
                const boxW = 124;
                const boxH = 46;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-move group"
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                  >
                    {/* Outer halo if selected */}
                    {isSelected && (
                      <rect
                        x={-(boxW / 2 + 7)}
                        y={-(boxH / 2 + 5)}
                        width={boxW + 14}
                        height={boxH + 10}
                        rx="16"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="1.8"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Main Node Card */}
                    <rect
                      x={-boxW / 2}
                      y={-boxH / 2}
                      width={boxW}
                      height={boxH}
                      rx={node.type === 'stock' ? '5' : '23'}
                      fill={fillBg}
                      stroke={strokeColor}
                      strokeWidth={node.type === 'stock' ? '2.6' : '1.8'}
                      className="transition-colors shadow-sm"
                    />

                    {/* Stock double-border inner framing (System Dynamics convention) */}
                    {node.type === 'stock' && (
                      <rect
                        x={-(boxW / 2 - 4)}
                        y={-(boxH / 2 - 4)}
                        width={boxW - 8}
                        height={boxH - 8}
                        rx="3"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="0.9"
                        strokeOpacity="0.45"
                      />
                    )}

                    {/* Node Text Label */}
                    <text
                      x="0"
                      y="-2"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[12px] font-sans font-bold fill-stone-800 pointer-events-none select-none tracking-tight"
                    >
                      {node.name}
                    </text>

                    {/* Category subtitle */}
                    <text
                      x="0"
                      y="13"
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-stone-500 pointer-events-none select-none uppercase tracking-wider"
                    >
                      {node.type === 'stock'
                        ? '存量 (Stock)'
                        : node.type === 'flow'
                        ? '流量 (Flow)'
                        : '辅助 (Aux)'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Canvas bottom hint & node fine-tuning controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 mt-2 px-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                选中节点:{' '}
                {selectedNodeId ? (
                  <strong className="text-stone-900 font-semibold">{nodeMap.get(selectedNodeId)?.name}</strong>
                ) : (
                  '未选择 (点击节点后可拖拽或使用键盘方向键微调)'
                )}
              </span>

              {selectedNodeId && nodeMap.get(selectedNodeId) && (
                <div className="flex items-center gap-1.5 font-mono bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-700">
                  <span>X: {nodeMap.get(selectedNodeId)?.x}</span>
                  <span>Y: {nodeMap.get(selectedNodeId)?.y}</span>
                </div>
              )}
            </div>

            {selectedNodeId && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-400 font-sans mr-0.5">微调:</span>
                <button
                  type="button"
                  onClick={() => handleNudgeNode(-38, 0)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-mono"
                  title="向左移动 1 厘米 (约 38px)"
                >
                  ← 左移 1cm
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeNode(38, 0)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-mono"
                  title="向右移动 1 厘米 (约 38px)"
                >
                  右移 1cm →
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeNode(0, -38)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-mono"
                  title="向上移动 1 厘米"
                >
                  ↑ 上移 1cm
                </button>
                <button
                  type="button"
                  onClick={() => handleNudgeNode(0, 38)}
                  className="px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer text-[10px] font-mono"
                  title="向下移动 1 厘米"
                >
                  下移 1cm ↓
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteNode(selectedNodeId)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 cursor-pointer text-xs font-medium ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Loops List (Below in Spacious mode, or right side in Split mode) */}
        <div className={`space-y-4 ${isSpaciousMode ? 'w-full' : ''}`}>
          <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-tight">
                  自动探测闭环反馈回路 (Feedback Loops)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {detectedLoops.length} 个回路
              </span>
            </div>

            {detectedLoops.length === 0 ? (
              <div className="text-xs text-stone-400 py-6 text-center leading-relaxed">
                当前图谱未检测到闭合回路。尝试连接形成首尾闭合的因果回路。
              </div>
            ) : (
              <div
                className={`gap-3 ${
                  isSpaciousMode
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-2.5 max-h-[460px] overflow-y-auto pr-1'
                }`}
              >
                {detectedLoops.map((loop) => {
                  const isReinforcing = loop.type === 'R';
                  const isHovered = activeHoverLoop?.id === loop.id;

                  return (
                    <div
                      key={loop.id}
                      onMouseEnter={() => setActiveHoverLoop(loop)}
                      onMouseLeave={() => setActiveHoverLoop(null)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isHovered
                          ? isReinforcing
                            ? 'bg-orange-50 border-orange-400 shadow-xs ring-2 ring-orange-300/40'
                            : 'bg-sky-50 border-sky-400 shadow-xs ring-2 ring-sky-300/40'
                          : isReinforcing
                          ? 'bg-stone-50/70 border-stone-200 hover:border-orange-200 hover:bg-orange-50/40'
                          : 'bg-stone-50/70 border-stone-200 hover:border-sky-200 hover:bg-sky-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                            isReinforcing ? 'bg-orange-600 text-white' : 'bg-sky-700 text-white'
                          }`}
                        >
                          {isReinforcing ? 'R 增强回路 (正反馈)' : 'B 调节回路 (负反馈)'}
                        </span>
                        {loop.hasDelay && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDelayExplainer(true);
                            }}
                            className="flex items-center gap-0.5 text-[10px] text-amber-800 font-mono font-bold bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 cursor-pointer"
                            title="包含 // 延迟标记，点击查看学术影响"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>含 // 延迟</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-900 font-semibold leading-snug mb-1">
                        {loop.nodes.map((nid) => nodeMap.get(nid)?.name || nid).join(' → ')}
                      </div>

                      <div className="text-[11px] text-stone-500 leading-tight">
                        <MathText text={loop.polarityReason} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delay "//" Deep Educational Explainer Modal */}
      {showDelayExplainer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-mono font-extrabold text-xl shadow-xs">
                  //
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif">
                    系统动力学图符解析：“//” 是什么意思？
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    Jay Forrester & John Sterman 因果回路规范 · 延迟 (Delay)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDelayExplainer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Definition Slice */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-800 space-y-2 leading-relaxed">
              <strong className="text-sm font-bold text-amber-900 block">
                核心定义: 物理与信息延迟 (Material & Information Delay)
              </strong>
              <p>
                在因果回路图（CLD）中，连线箭头上的 <strong>“//”（双斜线标记）</strong>代表该因果联系存在显著的<strong>时间滞后（Time Lag / Delay）</strong>。
              </p>
              <p>
                即：自变量（Cause）的变化<strong>并不会立即引起</strong>因变量（Effect）的响应，而是需要经历数天、数月乃至数年的时间窗口才开始显现。
              </p>
            </div>

            {/* Two Types of Delays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-1">
                <span className="font-bold text-sky-900 block flex items-center gap-1">
                  <span>① 物料实体延迟 (Material Delay)</span>
                </span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  物理实体的流动与加工需要时间。例如：原材料采购前置期、工厂流水线生产加工周期、货物在途运输管线。
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-1">
                <span className="font-bold text-purple-900 block flex items-center gap-1">
                  <span>② 信息感知与决策延迟 (Information Delay)</span>
                </span>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  决策者接收信号、识别趋势并执行干预需要时间。例如：市场销售数据季度汇总滞后、新员工业务带教培训滞后。
                </p>
              </div>
            </div>

            {/* Why // is Fatal to Stability */}
            <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-2 leading-relaxed">
              <strong className="font-bold block text-rose-900 flex items-center gap-1.5">
                <span>⚠️ 动力学致命失稳机制：为什么 “//” 必然引发振荡与超调？</span>
              </strong>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-rose-900">
                <li>
                  <strong>相位滞后 (Phase Lag):</strong> 负反馈回路（<KatexMath math="B" /> 环）本意是消除偏差以维持系统平衡；但如果在反馈通路上加装了长延迟 <code>//</code>，纠偏控制信号延迟了近 180° 到达，负反馈在数学上蜕变为加剧振荡的“假正反馈”！
                </li>
                <li>
                  <strong>过度纠偏与超调 (Overshoot):</strong> 决策者在未看到成效时误以为纠偏力度不够，持续猛踩油门/加人/补货；当滞后累积释放时，系统严重超越承载极限，引发海啸式库存积压或断崖式崩溃。
                </li>
              </ul>
            </div>

            {/* Footer Close */}
            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowDelayExplainer(false)}
                className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                我知道了，返回画布
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Node Modal Dialog */}
      {showAddNode && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-stone-800">新建系统动力学变量节点</h3>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">变量名称</label>
              <input
                type="text"
                placeholder="例如: 研发投入、库存、用户活跃"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">变量类别</label>
              <select
                value={newNodeType}
                onChange={(e) => setNewNodeType(e.target.value as VariableType)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                <option value="auxiliary">辅助变量 (Auxiliary)</option>
                <option value="stock">存量变量 (Stock/Level)</option>
                <option value="flow">流量变量 (Flow/Rate)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddNode(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddNode}
                className="px-3 py-1.5 text-xs bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium cursor-pointer"
              >
                添加节点
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal Dialog */}
      {showAddLink && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-stone-800">新建因果联系 (Causal Link)</h3>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">源变量 (Cause)</label>
              <select
                value={linkSource}
                onChange={(e) => setLinkSource(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg"
              >
                <option value="">-- 选择源变量 --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-700 block mb-1">目标变量 (Effect)</label>
              <select
                value={linkTarget}
                onChange={(e) => setLinkTarget(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg"
              >
                <option value="">-- 选择目标变量 --</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">因果极性</label>
                <select
                  value={linkPolarity}
                  onChange={(e) => setLinkPolarity(e.target.value as '+' | '-')}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-lg"
                >
                  <option value="+">+ 正向促进 (同向变化)</option>
                  <option value="-">- 反向抑制 (反向变化)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700 block mb-1">时滞延迟 (//)</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="linkDelayCheck"
                    checked={linkDelay}
                    onChange={(e) => setLinkDelay(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="linkDelayCheck" className="text-xs text-stone-700 cursor-pointer">
                    包含延迟标记 (//)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddLink(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3 py-1.5 text-xs bg-teal-700 text-white rounded-lg hover:bg-teal-800 font-medium cursor-pointer"
              >
                连接
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
