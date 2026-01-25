import { useCallback, useEffect, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import type {
  TimelineNode as TimelineNodeType,
  Keyframe,
  EasingType,
  TimelineFPS,
  KeyframeTransforms,
  PlayDirection,
  TransformNodeData,
} from '@/types/nodes';
import { NODE_COLORS, EASING_LABELS, FPS_OPTIONS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { TimelineIcon, PlusIcon, TrashIcon, RepeatIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { interpolateTransforms, DEFAULT_TRANSFORMS } from '@/engine/animation';

// Selector to get connected transform ID for a specific timeline node
// Looks for edges from timeline-out handle to timeline-in handle on Transform
const useConnectedTransformId = (timelineId: string): string | null => {
  return useFlowStore((state) => {
    const outgoingEdge = state.edges.find(
      (e) => e.source === timelineId && e.sourceHandle === 'timeline-out'
    );
    if (!outgoingEdge) return null;
    const targetNode = state.nodes.find((n) => n.id === outgoingEdge.target);
    if (!targetNode || targetNode.type !== 'transform') return null;
    return targetNode.id;
  });
};

const generateKeyframeId = (): string => {
  return `kf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};

// Section wrapper for visual grouping
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-2.5 py-2 rounded-md bg-black/15 ${className}`}>{children}</div>;
}

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const connectedTransformId = useConnectedTransformId(id);
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

  // Refs to hold latest values for animation loop (avoids effect restarts)
  const keyframesRef = useRef(keyframes);
  const easingRef = useRef(easing);
  const durationRef = useRef(duration);
  const loopRef = useRef(loop);

  // Keep refs updated
  keyframesRef.current = keyframes;
  easingRef.current = easing;
  durationRef.current = duration;
  loopRef.current = loop;

  const accentColor = NODE_COLORS.timeline;

  // Get the full Transform node data when needed
  const getConnectedTransformNode = useCallback(() => {
    if (!connectedTransformId) return null;
    const { nodes } = useFlowStore.getState();
    return nodes.find((n) => n.id === connectedTransformId) ?? null;
  }, [connectedTransformId]);

  // Sync ref with prop when not playing
  useEffect(() => {
    if (!isPlaying) {
      timeRef.current = currentTime;
    }
  }, [currentTime, isPlaying]);

  // Playback animation loop
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

      // Read latest values from refs
      const currentDuration = durationRef.current;
      const currentLoop = loopRef.current;
      const currentKeyframes = keyframesRef.current;
      const currentEasing = easingRef.current;

      let newTime = timeRef.current + delta * playDirection;

      if (playDirection > 0) {
        if (newTime >= currentDuration) {
          if (currentLoop) {
            newTime = 0;
          } else {
            newTime = currentDuration;
            timeRef.current = newTime;
            updateNodeData(id, { currentTime: newTime, isPlaying: false });
            return;
          }
        }
      } else {
        if (newTime <= 0) {
          if (currentLoop) {
            newTime = currentDuration;
          } else {
            newTime = 0;
            timeRef.current = newTime;
            updateNodeData(id, { currentTime: newTime, isPlaying: false });
            return;
          }
        }
      }

      timeRef.current = newTime;

      if (currentKeyframes.length > 0) {
        const transforms = interpolateTransforms(currentKeyframes, newTime, currentEasing);
        if (connectedTransformId) {
          updateNodeData(connectedTransformId, {
            scale: transforms.scale,
            offsetX: transforms.offsetX,
            offsetY: transforms.offsetY,
            rotation: transforms.rotation,
            opacity: transforms.opacity,
          });
        }
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
  }, [id, isPlaying, playDirection, connectedTransformId, updateNodeData]);

  // Update transform when scrubbing
  useEffect(() => {
    if (isPlaying) return;
    if (keyframes.length === 0) return;

    const transforms = interpolateTransforms(keyframes, currentTime, easing);
    if (connectedTransformId) {
      updateNodeData(connectedTransformId, {
        scale: transforms.scale,
        offsetX: transforms.offsetX,
        offsetY: transforms.offsetY,
        rotation: transforms.rotation,
        opacity: transforms.opacity,
      });
    }
    updateNodeData(id, { currentTransforms: transforms });
  }, [id, currentTime, keyframes, easing, isPlaying, connectedTransformId, updateNodeData]);

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

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = Math.max(0, Math.min(parseFloat(e.target.value), duration));
      timeRef.current = time;
      updateNodeData(id, { currentTime: time, isPlaying: false });
    },
    [id, duration, updateNodeData]
  );

  const handleFpsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { fps: parseInt(e.target.value, 10) as TimelineFPS });
    },
    [id, updateNodeData]
  );

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDuration = Math.max(0.1, parseFloat(e.target.value) || 1);
      const clampedTime = Math.min(currentTime, newDuration);
      timeRef.current = clampedTime;
      updateNodeData(id, { duration: newDuration, currentTime: clampedTime });
    },
    [id, currentTime, updateNodeData]
  );

  const handleLoopToggle = useCallback(() => {
    updateNodeData(id, { loop: !loop });
  }, [id, loop, updateNodeData]);

  const handleEasingChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { easing: e.target.value as EasingType });
    },
    [id, updateNodeData]
  );

  const handleAddKeyframe = useCallback(() => {
    const clampedTime = Math.max(0, Math.min(currentTime, duration));
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

    const existingKf = keyframes.find((kf) => Math.abs(kf.time - clampedTime) < 0.05);
    let newKeyframes: Keyframe[];
    if (existingKf) {
      newKeyframes = keyframes.map((kf) =>
        kf.id === existingKf.id ? { ...kf, transforms: transformValues } : kf
      );
    } else {
      const newKeyframe: Keyframe = {
        id: generateKeyframeId(),
        time: clampedTime,
        transforms: transformValues,
      };
      newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    }

    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, currentTime, duration, keyframes, getConnectedTransformNode, updateNodeData]);

  const handleRemoveKeyframe = useCallback(
    (kfId: string) => {
      const newKeyframes = keyframes.filter((kf) => kf.id !== kfId);
      updateNodeData(id, { keyframes: newKeyframes });
    },
    [id, keyframes, updateNodeData]
  );

  const handleDeleteKeyframeAtTime = useCallback(() => {
    const kfAtTime = keyframes.find((kf) => Math.abs(kf.time - currentTime) < 0.05);
    if (kfAtTime) {
      const newKeyframes = keyframes.filter((kf) => kf.id !== kfAtTime.id);
      updateNodeData(id, { keyframes: newKeyframes });
    }
  }, [id, currentTime, keyframes, updateNodeData]);

  const handleKeyframeClick = useCallback(
    (kf: Keyframe) => {
      timeRef.current = kf.time;
      updateNodeData(id, { currentTime: kf.time, isPlaying: false });
    },
    [id, updateNodeData]
  );

  const selectedKeyframe = keyframes.find((kf) => Math.abs(kf.time - currentTime) < 0.05);
  const formatTime = (t: number) => Math.max(0, t).toFixed(1) + 's';
  const frameCount = Math.ceil(fps * duration);
  const displayTime = Math.max(0, Math.min(currentTime, duration));

  const timelineHandleStyle: React.CSSProperties = {
    background: 'var(--color-bg-panel)',
    borderColor: accentColor,
    borderWidth: 2,
    width: 12,
    height: 12,
  };

  return (
    <BaseNode
      nodeId={id}
      nodeType="timeline"
      name={data.name || 'Timeline'}
      selected={selected}
      showTargetHandle={false}
      showSourceHandle={false}
      icon={<TimelineIcon size={14} />}
      additionalHandles={
        <Handle
          type="source"
          position={Position.Top}
          id="timeline-out"
          style={{
            ...timelineHandleStyle,
          }}
        />
      }
    >
      <div className="space-y-2.5 nodrag">
        {/* Connection Warning */}
        {!connectedTransformId && (
          <div
            className="text-[10px] px-2.5 py-1.5 rounded-md text-center"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}
          >
            Connect to a Transform node
          </div>
        )}

        {/* Settings Row */}
        <Section>
          <div className="flex items-center gap-3">
            {/* FPS */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted uppercase tracking-wide">FPS</span>
              <select
                value={fps}
                onChange={handleFpsChange}
                className="w-12 px-1 py-0.5 text-[10px] font-mono rounded bg-black/30 border-none text-primary outline-none cursor-pointer"
              >
                {FPS_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-white/10" />

            {/* Duration */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted uppercase tracking-wide">Dur</span>
              <input
                type="number"
                min={0.1}
                max={60}
                step={0.1}
                value={duration}
                onChange={handleDurationChange}
                className="w-10 px-1 py-0.5 text-[10px] font-mono rounded bg-black/30 border-none text-primary outline-none no-spinner text-center"
              />
              <span className="text-[9px] text-muted">s</span>
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-white/10" />

            {/* Easing */}
            <select
              value={easing}
              onChange={handleEasingChange}
              className="w-[72px] px-1 py-0.5 text-[10px] rounded bg-black/30 border-none text-primary outline-none cursor-pointer"
            >
              {Object.entries(EASING_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Loop Toggle */}
            <button
              onClick={handleLoopToggle}
              className="p-1 rounded transition-all flex-shrink-0"
              style={{
                background: loop ? accentColor : 'rgba(0,0,0,0.3)',
                color: loop ? 'white' : 'var(--color-text-muted)',
                boxShadow: loop ? `0 0 8px ${accentColor}40` : 'none',
              }}
              title={loop ? 'Loop enabled' : 'Loop disabled'}
            >
              <RepeatIcon size={12} />
            </button>
          </div>
        </Section>

        {/* Timeline Track */}
        <Section className="py-3">
          {/* Time markers */}
          <div className="flex justify-between text-[8px] text-muted mb-1.5 px-0.5">
            <span>0s</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Track container */}
          <div className="relative h-6 rounded bg-black/30">
            {/* Keyframe markers */}
            {keyframes.map((kf) => {
              const leftPercent = Math.max(0, Math.min((kf.time / duration) * 100, 100));
              const isSelected = selectedKeyframe?.id === kf.id;
              return (
                <div
                  key={kf.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                  style={{ left: `${leftPercent}%`, zIndex: 10 }}
                >
                  <button
                    onClick={() => handleKeyframeClick(kf)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-2.5 h-2.5 transition-transform hover:scale-125"
                    style={{
                      color: isSelected ? accentColor : 'var(--color-text-muted)',
                      filter: isSelected ? `drop-shadow(0 0 3px ${accentColor})` : 'none',
                    }}
                    title={`Keyframe at ${formatTime(kf.time)}`}
                  >
                    <svg viewBox="0 0 10 10" fill="currentColor" className="w-full h-full">
                      <path d="M5 0L10 5L5 10L0 5Z" />
                    </svg>
                  </button>
                  {/* Delete on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveKeyframe(kf.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete keyframe"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 transition-all duration-75 pointer-events-none"
              style={{
                left: `${Math.max(0, Math.min((displayTime / duration) * 100, 100))}%`,
                background: accentColor,
                boxShadow: `0 0 6px ${accentColor}`,
                zIndex: 5,
              }}
            >
              <div
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: accentColor }}
              />
            </div>

            {/* Scrub slider (invisible, covers track) */}
            <input
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={displayTime}
              onChange={handleSeek}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              style={{ zIndex: 1 }}
            />
          </div>
        </Section>

        {/* Transport & Keyframe Controls */}
        <div className="flex items-center justify-between px-1">
          {/* Transport */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePlayReverse}
              className="p-1.5 rounded transition-all"
              style={{
                background: isPlaying && playDirection === -1 ? accentColor : 'transparent',
                color: isPlaying && playDirection === -1 ? 'white' : 'var(--color-text-muted)',
              }}
              title="Play Reverse"
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <polygon points="8,1 2,5 8,9" />
              </svg>
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 rounded text-muted hover:text-primary transition-colors"
              title="Stop"
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <rect x="2" y="2" width="6" height="6" />
              </svg>
            </button>
            <button
              onClick={handlePlayForward}
              className="p-1.5 rounded transition-all"
              style={{
                background: isPlaying && playDirection === 1 ? accentColor : 'transparent',
                color: isPlaying && playDirection === 1 ? 'white' : 'var(--color-text-muted)',
              }}
              title="Play Forward"
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <polygon points="2,1 8,5 2,9" />
              </svg>
            </button>
          </div>

          {/* Time Display */}
          <div
            className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <span className="text-primary">{formatTime(displayTime)}</span>
            <span className="text-muted"> / {formatTime(duration)}</span>
          </div>

          {/* Keyframe Actions */}
          <div className="flex items-center gap-1">
            {selectedKeyframe ? (
              <>
                <button
                  onClick={handleAddKeyframe}
                  disabled={!connectedTransformId}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all disabled:opacity-40"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                  title="Update keyframe"
                >
                  <PlusIcon size={10} />
                  <span className="text-muted">Upd</span>
                </button>
                <button
                  onClick={handleDeleteKeyframeAtTime}
                  className="p-1 rounded transition-all"
                  style={{ background: 'rgba(239, 68, 68, 0.2)' }}
                  title="Delete keyframe"
                >
                  <TrashIcon size={12} className="text-red-400" />
                </button>
              </>
            ) : (
              <button
                onClick={handleAddKeyframe}
                disabled={!connectedTransformId}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all disabled:opacity-40"
                style={{ background: connectedTransformId ? `${accentColor}30` : 'rgba(0,0,0,0.3)' }}
                title={connectedTransformId ? 'Add keyframe' : 'Connect to Transform first'}
              >
                <span style={{ color: connectedTransformId ? accentColor : undefined }}><PlusIcon size={10} /></span>
                <span className={connectedTransformId ? 'text-primary' : 'text-muted'}>Key</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex justify-between text-[9px] text-muted px-1 pt-0.5 border-t border-white/5">
          <span>
            {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''}
          </span>
          <span>{frameCount} frames</span>
        </div>
      </div>
    </BaseNode>
  );
}
