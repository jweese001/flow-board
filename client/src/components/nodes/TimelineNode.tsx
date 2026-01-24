import { useCallback, useEffect, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { TimelineNode as TimelineNodeType, Keyframe, EasingType, TimelineFPS, KeyframeTransforms, PlayDirection, TransformNodeData } from '@/types/nodes';
import { NODE_COLORS, EASING_LABELS, FPS_OPTIONS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { TimelineIcon, PlusIcon, TrashIcon, RepeatIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { interpolateTransforms, DEFAULT_TRANSFORMS } from '@/engine/animation';

// Generate unique keyframe ID
const generateKeyframeId = (): string => {
  return `kf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeType>) {
  const { nodes, edges, updateNodeData } = useFlowStore();
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(data.currentTime ?? 0);

  const fps = data.fps ?? 24;
  const duration = data.duration ?? 2;
  const keyframes = data.keyframes ?? [];
  const loop = data.loop ?? true;
  const easing = data.easing ?? 'ease-in-out';
  const currentTime = data.currentTime ?? 0;
  const isPlaying = data.isPlaying ?? false;
  const playDirection = data.playDirection ?? 1;

  // Find the connected Transform node (Timeline output → Transform input)
  const getConnectedTransformNode = useCallback(() => {
    // Find edge where Timeline is the source
    const outgoingEdge = edges.find((e) => e.source === id);
    if (!outgoingEdge) return null;

    // Find the target node
    const targetNode = nodes.find((n) => n.id === outgoingEdge.target);
    if (!targetNode || targetNode.type !== 'transform') return null;

    return targetNode;
  }, [id, edges, nodes]);

  const connectedTransform = getConnectedTransformNode();

  // Sync ref with prop when not playing (for scrubbing)
  useEffect(() => {
    if (!isPlaying) {
      timeRef.current = currentTime;
    }
  }, [currentTime, isPlaying]);

  // Playback animation loop - writes to connected Transform node
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const animate = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      let newTime = timeRef.current + delta * playDirection;

      // Clamp time to valid range
      if (playDirection > 0) {
        if (newTime >= duration) {
          if (loop) {
            newTime = 0;
          } else {
            newTime = duration;
            timeRef.current = newTime;
            updateNodeData(id, { currentTime: newTime, isPlaying: false });
            return;
          }
        }
      } else {
        if (newTime <= 0) {
          if (loop) {
            newTime = duration;
          } else {
            newTime = 0;
            timeRef.current = newTime;
            updateNodeData(id, { currentTime: newTime, isPlaying: false });
            return;
          }
        }
      }

      timeRef.current = newTime;

      // Interpolate and write to connected Transform node
      if (keyframes.length > 0) {
        const transforms = interpolateTransforms(keyframes, newTime, easing);
        const transformNode = getConnectedTransformNode();
        if (transformNode) {
          updateNodeData(transformNode.id, {
            scale: transforms.scale,
            offsetX: transforms.offsetX,
            offsetY: transforms.offsetY,
            rotation: transforms.rotation,
            opacity: transforms.opacity,
          });
        }
        // Also store on Timeline for downstream nodes that read directly
        updateNodeData(id, { currentTime: newTime, currentTransforms: transforms });
      } else {
        updateNodeData(id, { currentTime: newTime });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [id, isPlaying, playDirection, duration, loop, easing, keyframes, getConnectedTransformNode, updateNodeData]);

  // Update transform when scrubbing (not playing)
  useEffect(() => {
    if (isPlaying) return;
    if (keyframes.length === 0) return;

    const transforms = interpolateTransforms(keyframes, currentTime, easing);
    const transformNode = getConnectedTransformNode();
    if (transformNode) {
      updateNodeData(transformNode.id, {
        scale: transforms.scale,
        offsetX: transforms.offsetX,
        offsetY: transforms.offsetY,
        rotation: transforms.rotation,
        opacity: transforms.opacity,
      });
    }
    updateNodeData(id, { currentTransforms: transforms });
  }, [id, currentTime, keyframes, easing, isPlaying, getConnectedTransformNode, updateNodeData]);

  const handlePlayForward = useCallback(() => {
    if (isPlaying && playDirection === 1) {
      updateNodeData(id, { isPlaying: false });
    } else {
      const newTime = currentTime >= duration ? 0 : currentTime;
      timeRef.current = newTime;
      updateNodeData(id, { isPlaying: true, playDirection: 1 as PlayDirection, currentTime: newTime });
    }
  }, [id, isPlaying, playDirection, currentTime, duration, updateNodeData]);

  const handlePlayReverse = useCallback(() => {
    if (isPlaying && playDirection === -1) {
      updateNodeData(id, { isPlaying: false });
    } else {
      const newTime = currentTime <= 0 ? duration : currentTime;
      timeRef.current = newTime;
      updateNodeData(id, { isPlaying: true, playDirection: -1 as PlayDirection, currentTime: newTime });
    }
  }, [id, isPlaying, playDirection, currentTime, duration, updateNodeData]);

  const handleStop = useCallback(() => {
    timeRef.current = 0;
    updateNodeData(id, { isPlaying: false, currentTime: 0 });
  }, [id, updateNodeData]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Math.max(0, Math.min(parseFloat(e.target.value), duration));
    timeRef.current = time;
    updateNodeData(id, { currentTime: time, isPlaying: false });
  }, [id, duration, updateNodeData]);

  const handleFpsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { fps: parseInt(e.target.value, 10) as TimelineFPS });
  }, [id, updateNodeData]);

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(0.1, parseFloat(e.target.value) || 1);
    const clampedTime = Math.min(currentTime, newDuration);
    timeRef.current = clampedTime;
    updateNodeData(id, { duration: newDuration, currentTime: clampedTime });
  }, [id, currentTime, updateNodeData]);

  const handleLoopToggle = useCallback(() => {
    updateNodeData(id, { loop: !loop });
  }, [id, loop, updateNodeData]);

  const handleEasingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { easing: e.target.value as EasingType });
  }, [id, updateNodeData]);

  // Add keyframe by capturing connected Transform node's current values
  const handleAddKeyframe = useCallback(() => {
    const clampedTime = Math.max(0, Math.min(currentTime, duration));

    // Get transform values from connected Transform node, or use defaults
    let transformValues: KeyframeTransforms = { ...DEFAULT_TRANSFORMS };
    const transformNode = getConnectedTransformNode();
    if (transformNode) {
      const tData = transformNode.data as TransformNodeData;
      transformValues = {
        scale: tData.scale ?? 1,
        offsetX: tData.offsetX ?? 0,
        offsetY: tData.offsetY ?? 0,
        rotation: tData.rotation ?? 0,
        opacity: tData.opacity ?? 100,
      };
    }

    const newKeyframe: Keyframe = {
      id: generateKeyframeId(),
      time: clampedTime,
      transforms: transformValues,
    };

    const newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, currentTime, duration, keyframes, getConnectedTransformNode, updateNodeData]);

  const handleRemoveKeyframe = useCallback((kfId: string) => {
    const newKeyframes = keyframes.filter((kf) => kf.id !== kfId);
    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, keyframes, updateNodeData]);

  const handleKeyframeClick = useCallback((kf: Keyframe) => {
    timeRef.current = kf.time;
    updateNodeData(id, { currentTime: kf.time, isPlaying: false });
  }, [id, updateNodeData]);

  // Find the currently selected keyframe
  const selectedKeyframe = keyframes.find((kf) => Math.abs(kf.time - currentTime) < 0.05);

  const formatTime = (t: number) => Math.max(0, t).toFixed(1) + 's';
  const frameCount = Math.ceil(fps * duration);
  const displayTime = Math.max(0, Math.min(currentTime, duration));

  return (
    <BaseNode
      nodeId={id}
      nodeType="timeline"
      name={data.name || 'Timeline'}
      selected={selected}
      showTargetHandle={true}
      showSourceHandle={true}
      icon={<TimelineIcon size={14} />}
    >
      <div className="space-y-3">
        {/* Connection status */}
        {!connectedTransform && (
          <div
            className="text-[10px] px-2 py-1.5 rounded text-center"
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
          >
            Connect to a Transform node
          </div>
        )}

        {/* Top Controls: FPS, Duration, Loop */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted">FPS</label>
            <select
              value={fps}
              onChange={handleFpsChange}
              className="w-14 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
            >
              {FPS_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted">Dur</label>
            <input
              type="number"
              min={0.1}
              max={60}
              step={0.1}
              value={duration}
              onChange={handleDurationChange}
              className="w-12 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
            />
            <span className="text-[10px] text-muted">s</span>
          </div>

          <button
            onClick={handleLoopToggle}
            className={`p-1 rounded transition-colors ${loop ? 'bg-purple-600 text-white' : 'bg-bg-elevated text-muted'}`}
            title={loop ? 'Loop enabled' : 'Loop disabled'}
          >
            <RepeatIcon size={12} />
          </button>
        </div>

        {/* Easing */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-muted">Easing</label>
          <select
            value={easing}
            onChange={handleEasingChange}
            className="flex-1 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
          >
            {Object.entries(EASING_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Timeline Track */}
        <div className="relative">
          <div className="flex justify-between text-[8px] text-muted mb-1">
            <span>0s</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            className="relative h-8 rounded"
            style={{ background: 'var(--color-bg-elevated)' }}
          >
            {/* Keyframe markers */}
            {keyframes.map((kf) => {
              const leftPercent = Math.max(0, Math.min((kf.time / duration) * 100, 100));
              const isSelected = selectedKeyframe?.id === kf.id;
              return (
                <div key={kf.id} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group" style={{ left: `${leftPercent}%` }}>
                  <button
                    onClick={() => handleKeyframeClick(kf)}
                    className="w-3 h-3 transition-transform hover:scale-125"
                    style={{ color: isSelected ? NODE_COLORS.timeline : '#6b7280' }}
                    title={`Keyframe at ${formatTime(kf.time)}`}
                  >
                    <svg viewBox="0 0 10 10" fill="currentColor" className="w-full h-full">
                      <path d="M5 0L10 5L5 10L0 5Z" />
                    </svg>
                  </button>
                  {/* Delete button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveKeyframe(kf.id);
                    }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete keyframe"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${Math.max(0, Math.min((displayTime / duration) * 100, 100))}%`,
                background: NODE_COLORS.timeline,
              }}
            >
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                style={{ background: NODE_COLORS.timeline }}
              />
            </div>
          </div>

          {/* Scrub slider */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={displayTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
            style={{ top: '14px' }}
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePlayReverse}
              className="p-1.5 rounded transition-colors"
              style={{
                background: isPlaying && playDirection === -1 ? NODE_COLORS.timeline : 'var(--color-bg-elevated)',
                color: isPlaying && playDirection === -1 ? 'white' : 'currentColor',
              }}
              title={isPlaying && playDirection === -1 ? 'Pause' : 'Play Reverse'}
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <polygon points="8,1 2,5 8,9" />
              </svg>
            </button>

            <button
              onClick={handleStop}
              className="p-1.5 rounded bg-bg-elevated hover:bg-bg-hover transition-colors"
              title="Stop (reset to start)"
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" />
              </svg>
            </button>

            <button
              onClick={handlePlayForward}
              className="p-1.5 rounded transition-colors"
              style={{
                background: isPlaying && playDirection === 1 ? NODE_COLORS.timeline : 'var(--color-bg-elevated)',
                color: isPlaying && playDirection === 1 ? 'white' : 'currentColor',
              }}
              title={isPlaying && playDirection === 1 ? 'Pause' : 'Play Forward'}
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <polygon points="2,1 8,5 2,9" />
              </svg>
            </button>
          </div>

          <div className="text-[10px] font-mono text-muted">
            {formatTime(displayTime)} / {formatTime(duration)}
          </div>

          <button
            onClick={handleAddKeyframe}
            disabled={!connectedTransform}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-bg-elevated hover:bg-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={connectedTransform ? "Add keyframe from Transform values" : "Connect to Transform first"}
          >
            <PlusIcon size={10} />
            Key
          </button>
        </div>

        {/* Info bar */}
        <div className="flex justify-between text-[9px] text-muted">
          <span>{keyframes.length} keyframes</span>
          <span>{frameCount} frames</span>
        </div>
      </div>
    </BaseNode>
  );
}
