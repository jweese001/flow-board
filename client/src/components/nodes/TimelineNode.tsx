import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
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
import { TimelineIcon, PlusIcon, TrashIcon, RepeatIcon, DownloadIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { interpolateTransforms } from '@/engine/animation';
import { exportAnimation, findConnectedRenderNode } from '@/services/animationExport';

// Hook to get connected transforms with stable reference
const useConnectedTransforms = (timelineId: string): { id: string; name: string }[] => {
  // Get a serialized string of connected transforms to ensure stable reference
  const encoded = useFlowStore((state) => {
    const outgoingEdges = state.edges.filter(
      (e) => e.source === timelineId && e.sourceHandle === 'timeline-out'
    );
    const result: string[] = [];
    for (const edge of outgoingEdges) {
      const targetNode = state.nodes.find((n) => n.id === edge.target);
      if (targetNode && targetNode.type === 'transform') {
        const data = targetNode.data as TransformNodeData;
        result.push(`${targetNode.id}::${data.name || 'Transform'}`);
      }
    }
    return result.join('|');
  });

  return useMemo(() => {
    if (!encoded) return [];
    return encoded.split('|').filter(Boolean).map((item) => {
      const [id, name] = item.split('::');
      return { id, name };
    });
  }, [encoded]);
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
  const connectedTransforms = useConnectedTransforms(id);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(data.currentTime ?? 0);

  const fps = data.fps ?? 24;
  const duration = data.duration ?? 2;
  const tracks = data.tracks ?? {};
  const selectedTracks = data.selectedTracks ?? connectedTransforms.map((t) => t.id);
  const loop = data.loop ?? true;
  const easing = data.easing ?? 'ease-in-out';
  const currentTime = data.currentTime ?? 0;
  const isPlaying = data.isPlaying ?? false;
  const playDirection = data.playDirection ?? 1;

  // Refs to hold latest values for animation loop
  const tracksRef = useRef(tracks);
  const easingRef = useRef(easing);
  const durationRef = useRef(duration);
  const loopRef = useRef(loop);
  const lastStoreUpdateRef = useRef<number>(0);

  // Keep refs updated
  tracksRef.current = tracks;
  easingRef.current = easing;
  durationRef.current = duration;
  loopRef.current = loop;

  const accentColor = NODE_COLORS.timeline;

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');

  // Get total keyframe count across all tracks
  const totalKeyframes = useMemo(() => {
    return Object.values(tracks).reduce((sum, kfs) => sum + kfs.length, 0);
  }, [tracks]);

  // Get keyframes for display (merged from all tracks, sorted by time)
  const displayKeyframes = useMemo(() => {
    const allKfs: { time: number; trackId: string; id: string }[] = [];
    for (const [trackId, kfs] of Object.entries(tracks)) {
      for (const kf of kfs) {
        allKfs.push({ time: kf.time, trackId, id: kf.id });
      }
    }
    // Remove duplicate times (show one marker per time)
    const uniqueTimes = new Map<number, { time: number; trackId: string; id: string }>();
    for (const kf of allKfs) {
      const key = Math.round(kf.time * 100); // Round to 10ms precision
      if (!uniqueTimes.has(key)) {
        uniqueTimes.set(key, kf);
      }
    }
    return Array.from(uniqueTimes.values()).sort((a, b) => a.time - b.time);
  }, [tracks]);

  // Sync ref with prop when not playing
  useEffect(() => {
    if (!isPlaying) {
      timeRef.current = currentTime;
    }
  }, [currentTime, isPlaying]);

  // Get transform node data
  const getTransformData = useCallback((transformId: string): TransformNodeData | null => {
    const { nodes } = useFlowStore.getState();
    const node = nodes.find((n) => n.id === transformId);
    if (!node || node.type !== 'transform') return null;
    return node.data as TransformNodeData;
  }, []);

  // Update all connected transforms with interpolated values
  const updateAllTransforms = useCallback(
    (time: number, currentTracks: Record<string, Keyframe[]>, currentEasing: EasingType) => {
      for (const transform of connectedTransforms) {
        const trackKfs = currentTracks[transform.id];
        if (trackKfs && trackKfs.length > 0) {
          const transforms = interpolateTransforms(trackKfs, time, currentEasing);
          updateNodeData(transform.id, {
            scale: transforms.scale,
            offsetX: transforms.offsetX,
            offsetY: transforms.offsetY,
            rotation: transforms.rotation,
            opacity: transforms.opacity,
          });
        }
      }
    },
    [connectedTransforms, updateNodeData]
  );

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

      const currentDuration = durationRef.current;
      const currentLoop = loopRef.current;
      const currentTracks = tracksRef.current;
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

      // Throttle ALL store updates to ~20fps to prevent memory leak from excessive re-renders
      // Each connected transform + timeline = N+1 store updates per tick
      const storeUpdateInterval = 50; // ms (~20fps for smoother animation)
      if (now - lastStoreUpdateRef.current >= storeUpdateInterval) {
        lastStoreUpdateRef.current = now;
        // Update all transforms
        updateAllTransforms(newTime, currentTracks, currentEasing);
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
  }, [id, isPlaying, playDirection, updateNodeData, updateAllTransforms]);

  // Update transforms when scrubbing
  useEffect(() => {
    if (isPlaying) return;
    updateAllTransforms(currentTime, tracks, easing);
  }, [currentTime, tracks, easing, isPlaying, updateAllTransforms]);

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

  const handleTrackToggle = useCallback(
    (transformId: string) => {
      const newSelected = selectedTracks.includes(transformId)
        ? selectedTracks.filter((t) => t !== transformId)
        : [...selectedTracks, transformId];
      updateNodeData(id, { selectedTracks: newSelected });
    },
    [id, selectedTracks, updateNodeData]
  );

  const handleAddKeyframe = useCallback(() => {
    const clampedTime = Math.max(0, Math.min(currentTime, duration));
    const newTracks = { ...tracks };

    // Add keyframe for each selected track
    for (const transformId of selectedTracks) {
      const transformData = getTransformData(transformId);
      if (!transformData) continue;

      const transformValues: KeyframeTransforms = {
        scale: transformData.scale ?? 1,
        offsetX: transformData.offsetX ?? 0,
        offsetY: transformData.offsetY ?? 0,
        rotation: transformData.rotation ?? 0,
        opacity: transformData.opacity ?? 100,
      };

      const trackKfs = newTracks[transformId] || [];
      const existingKf = trackKfs.find((kf) => Math.abs(kf.time - clampedTime) < 0.05);

      if (existingKf) {
        // Update existing keyframe
        newTracks[transformId] = trackKfs.map((kf) =>
          kf.id === existingKf.id ? { ...kf, transforms: transformValues } : kf
        );
      } else {
        // Add new keyframe
        const newKeyframe: Keyframe = {
          id: generateKeyframeId(),
          time: clampedTime,
          transforms: transformValues,
        };
        newTracks[transformId] = [...trackKfs, newKeyframe].sort((a, b) => a.time - b.time);
      }
    }

    updateNodeData(id, { tracks: newTracks });
  }, [id, currentTime, duration, tracks, selectedTracks, getTransformData, updateNodeData]);

  const handleDeleteKeyframeAtTime = useCallback(() => {
    const newTracks = { ...tracks };
    let deleted = false;

    for (const [trackId, trackKfs] of Object.entries(newTracks)) {
      const kfAtTime = trackKfs.find((kf) => Math.abs(kf.time - currentTime) < 0.05);
      if (kfAtTime) {
        newTracks[trackId] = trackKfs.filter((kf) => kf.id !== kfAtTime.id);
        deleted = true;
      }
    }

    if (deleted) {
      updateNodeData(id, { tracks: newTracks });
    }
  }, [id, currentTime, tracks, updateNodeData]);

  const handleKeyframeClick = useCallback(
    (time: number) => {
      timeRef.current = time;
      updateNodeData(id, { currentTime: time, isPlaying: false });
    },
    [id, updateNodeData]
  );

  const handleExport = useCallback(
    async (format: 'sequence' | 'gif') => {
      // Stop playback if running
      if (isPlaying) {
        updateNodeData(id, { isPlaying: false });
      }

      // Find connected render node (Comp or Page)
      const renderNode = findConnectedRenderNode(id);
      if (!renderNode) {
        alert('No Comp or Page node found. Connect your transforms to a Comp or Page node to export.');
        return;
      }

      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('Starting export...');

      try {
        await exportAnimation({
          timelineId: id,
          renderNodeId: renderNode.id,
          renderNodeType: renderNode.type,
          fps,
          duration,
          tracks,
          easing,
          format,
          onProgress: (progress, message) => {
            setExportProgress(progress);
            setExportMessage(message);
          },
        });
      } catch (error) {
        console.error('Export failed:', error);
        alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }
    },
    [id, isPlaying, fps, duration, tracks, easing, updateNodeData]
  );

  const hasKeyframeAtTime = displayKeyframes.some((kf) => Math.abs(kf.time - currentTime) < 0.05);
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
          style={timelineHandleStyle}
        />
      }
    >
      <div className="space-y-2.5 nodrag">
        {/* Connection Status */}
        {connectedTransforms.length === 0 ? (
          <div
            className="text-[10px] px-2.5 py-1.5 rounded-md text-center"
            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}
          >
            Connect to Transform nodes
          </div>
        ) : (
          /* Connected Transforms with Checkboxes */
          <Section>
            <div className="text-[9px] text-muted uppercase tracking-wide mb-1.5">Transforms</div>
            <div className="space-y-1">
              {connectedTransforms.map((transform) => (
                <label
                  key={transform.id}
                  className="flex items-center gap-2 cursor-pointer text-[11px]"
                >
                  <input
                    type="checkbox"
                    checked={selectedTracks.includes(transform.id)}
                    onChange={() => handleTrackToggle(transform.id)}
                    className="w-3 h-3 rounded border-white/20 bg-black/30 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span
                    className="truncate"
                    style={{
                      color: selectedTracks.includes(transform.id)
                        ? 'var(--color-text-primary)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {transform.name}
                  </span>
                  <span className="text-[9px] text-muted ml-auto">
                    {(tracks[transform.id] || []).length} keys
                  </span>
                </label>
              ))}
            </div>
          </Section>
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

            <div className="w-px h-4 bg-white/10" />

            {/* Easing */}
            <select
              value={easing}
              onChange={handleEasingChange}
              className="flex-1 min-w-0 px-1 py-0.5 text-[10px] rounded bg-black/30 border-none text-primary outline-none cursor-pointer"
            >
              {Object.entries(EASING_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
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
            {displayKeyframes.map((kf) => {
              const leftPercent = Math.max(0, Math.min((kf.time / duration) * 100, 100));
              const isSelected = Math.abs(kf.time - currentTime) < 0.05;
              return (
                <div
                  key={`${kf.trackId}-${kf.id}`}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
                  style={{ left: `${leftPercent}%`, zIndex: 10 }}
                >
                  <button
                    onClick={() => handleKeyframeClick(kf.time)}
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

            {/* Scrub slider */}
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

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Loop Toggle */}
            <button
              onClick={handleLoopToggle}
              className="p-1.5 rounded transition-all"
              style={{
                background: loop ? `${accentColor}30` : 'transparent',
                color: loop ? accentColor : 'var(--color-text-muted)',
              }}
              title={loop ? 'Loop enabled' : 'Loop disabled'}
            >
              <RepeatIcon size={11} />
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
            {hasKeyframeAtTime ? (
              <>
                <button
                  onClick={handleAddKeyframe}
                  disabled={selectedTracks.length === 0}
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
                disabled={selectedTracks.length === 0}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-all disabled:opacity-40"
                style={{
                  background: selectedTracks.length > 0 ? `${accentColor}30` : 'rgba(0,0,0,0.3)',
                }}
                title={selectedTracks.length > 0 ? 'Add keyframe' : 'Select transforms first'}
              >
                <span style={{ color: selectedTracks.length > 0 ? accentColor : undefined }}>
                  <PlusIcon size={10} />
                </span>
                <span className={selectedTracks.length > 0 ? 'text-primary' : 'text-muted'}>Key</span>
              </button>
            )}
          </div>
        </div>

        {/* Export Section */}
        {isExporting ? (
          <Section className="space-y-1.5">
            <div className="text-[10px] text-center">{exportMessage}</div>
            <div className="h-1.5 rounded-full bg-black/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${exportProgress}%`,
                  background: accentColor,
                }}
              />
            </div>
          </Section>
        ) : (
          <div className="flex items-center gap-1.5 px-1">
            <button
              onClick={() => handleExport('sequence')}
              disabled={totalKeyframes === 0}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] transition-all disabled:opacity-40"
              style={{ background: totalKeyframes > 0 ? `${accentColor}30` : 'rgba(0,0,0,0.3)' }}
              title={totalKeyframes > 0 ? 'Export PNG sequence (use ffmpeg to convert to video)' : 'Add keyframes first'}
            >
              <DownloadIcon size={10} />
              <span>Export Frames</span>
            </button>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex justify-between text-[9px] text-muted px-1 pt-0.5 border-t border-white/5">
          <span>
            {totalKeyframes} keyframe{totalKeyframes !== 1 ? 's' : ''}
          </span>
          <span>{frameCount} frames</span>
        </div>
      </div>
    </BaseNode>
  );
}
