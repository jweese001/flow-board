import { useCallback, useEffect, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { TimelineNode as TimelineNodeType, Keyframe, EasingType, TimelineFPS, KeyframeTransforms } from '@/types/nodes';
import { NODE_COLORS, EASING_LABELS, FPS_OPTIONS } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { TimelineIcon, PlayIcon, PauseIcon, PlusIcon, TrashIcon, RepeatIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';
import { interpolateTransforms, DEFAULT_TRANSFORMS } from '@/engine/animation';

// Generate unique keyframe ID
const generateKeyframeId = (): string => {
  return `kf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
};

export function TimelineNode({ id, data, selected }: NodeProps<TimelineNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const fps = data.fps ?? 24;
  const duration = data.duration ?? 2;
  const keyframes = data.keyframes ?? [];
  const loop = data.loop ?? true;
  const easing = data.easing ?? 'ease-in-out';
  const currentTime = data.currentTime ?? 0;
  const isPlaying = data.isPlaying ?? false;

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
      const delta = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      let newTime = currentTime + delta;

      if (newTime >= duration) {
        if (loop) {
          newTime = newTime % duration;
        } else {
          newTime = duration;
          updateNodeData(id, { currentTime: newTime, isPlaying: false });
          return;
        }
      }

      updateNodeData(id, { currentTime: newTime });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [id, isPlaying, currentTime, duration, loop, updateNodeData]);

  // Update interpolated transforms whenever time/keyframes change
  useEffect(() => {
    const transforms = interpolateTransforms(keyframes, currentTime, easing);
    // Only update if transforms actually changed (avoid infinite loops)
    const current = data.currentTransforms;
    if (!current ||
        current.scale !== transforms.scale ||
        current.offsetX !== transforms.offsetX ||
        current.offsetY !== transforms.offsetY ||
        current.rotation !== transforms.rotation ||
        current.opacity !== transforms.opacity) {
      updateNodeData(id, { currentTransforms: transforms });
    }
  }, [id, keyframes, currentTime, easing, data.currentTransforms, updateNodeData]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      updateNodeData(id, { isPlaying: false });
    } else {
      // Reset to start if at the end
      const newTime = currentTime >= duration ? 0 : currentTime;
      updateNodeData(id, { isPlaying: true, currentTime: newTime });
    }
  }, [id, isPlaying, currentTime, duration, updateNodeData]);

  const handleStop = useCallback(() => {
    updateNodeData(id, { isPlaying: false, currentTime: 0 });
  }, [id, updateNodeData]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    updateNodeData(id, { currentTime: time, isPlaying: false });
  }, [id, updateNodeData]);

  const handleFpsChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { fps: parseInt(e.target.value, 10) as TimelineFPS });
  }, [id, updateNodeData]);

  const handleDurationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Math.max(0.1, parseFloat(e.target.value) || 1);
    updateNodeData(id, { duration: newDuration });
  }, [id, updateNodeData]);

  const handleLoopToggle = useCallback(() => {
    updateNodeData(id, { loop: !loop });
  }, [id, loop, updateNodeData]);

  const handleEasingChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { easing: e.target.value as EasingType });
  }, [id, updateNodeData]);

  const handleAddKeyframe = useCallback(() => {
    // Add keyframe at current time
    const newKeyframe: Keyframe = {
      id: generateKeyframeId(),
      time: currentTime,
      transforms: { ...DEFAULT_TRANSFORMS },
    };

    // Sort keyframes by time
    const newKeyframes = [...keyframes, newKeyframe].sort((a, b) => a.time - b.time);
    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, currentTime, keyframes, updateNodeData]);

  const handleRemoveKeyframe = useCallback((kfId: string) => {
    const newKeyframes = keyframes.filter((kf) => kf.id !== kfId);
    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, keyframes, updateNodeData]);

  const handleKeyframeClick = useCallback((kf: Keyframe) => {
    updateNodeData(id, { currentTime: kf.time, isPlaying: false });
  }, [id, updateNodeData]);

  const handleKeyframeTransformChange = useCallback((kfId: string, key: keyof KeyframeTransforms, value: number) => {
    const newKeyframes = keyframes.map((kf) => {
      if (kf.id === kfId) {
        return {
          ...kf,
          transforms: { ...kf.transforms, [key]: value },
        };
      }
      return kf;
    });
    updateNodeData(id, { keyframes: newKeyframes });
  }, [id, keyframes, updateNodeData]);

  // Find the currently selected keyframe (closest to current time)
  const selectedKeyframe = keyframes.find((kf) => Math.abs(kf.time - currentTime) < 0.05);

  // Format time as seconds with 1 decimal
  const formatTime = (t: number) => t.toFixed(1) + 's';

  // Calculate frame count
  const frameCount = Math.ceil(fps * duration);

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
        {/* Top Controls: FPS, Duration, Loop */}
        <div className="flex items-center gap-2">
          {/* FPS */}
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

          {/* Duration */}
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

          {/* Loop */}
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
          {/* Time ruler */}
          <div className="flex justify-between text-[8px] text-muted mb-1">
            <span>0s</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Track background */}
          <div
            className="relative h-8 rounded"
            style={{ background: 'var(--color-bg-elevated)' }}
          >
            {/* Keyframe markers */}
            {keyframes.map((kf) => {
              const leftPercent = (kf.time / duration) * 100;
              const isSelected = selectedKeyframe?.id === kf.id;
              return (
                <button
                  key={kf.id}
                  onClick={() => handleKeyframeClick(kf)}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 transition-transform hover:scale-125"
                  style={{
                    left: `${leftPercent}%`,
                    color: isSelected ? NODE_COLORS.timeline : '#6b7280',
                  }}
                  title={`Keyframe at ${formatTime(kf.time)}`}
                >
                  <svg viewBox="0 0 10 10" fill="currentColor" className="w-full h-full">
                    <path d="M5 0L10 5L5 10L0 5Z" />
                  </svg>
                </button>
              );
            })}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${(currentTime / duration) * 100}%`,
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
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
            style={{ top: '14px' }}
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={handleStop}
              className="p-1.5 rounded bg-bg-elevated hover:bg-bg-hover transition-colors"
              title="Stop"
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" />
              </svg>
            </button>
            <button
              onClick={handlePlayPause}
              className="p-1.5 rounded transition-colors"
              style={{
                background: isPlaying ? NODE_COLORS.timeline : 'var(--color-bg-elevated)',
                color: isPlaying ? 'white' : 'currentColor',
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon size={10} /> : <PlayIcon size={10} />}
            </button>
          </div>

          <div className="text-[10px] font-mono text-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <button
            onClick={handleAddKeyframe}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-bg-elevated hover:bg-bg-hover transition-colors"
            title="Add keyframe at current time"
          >
            <PlusIcon size={10} />
            Key
          </button>
        </div>

        {/* Keyframe Editor (when a keyframe is selected) */}
        {selectedKeyframe && (
          <div className="p-2 rounded space-y-2" style={{ background: 'var(--color-bg-elevated)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: NODE_COLORS.timeline }}>
                Keyframe @ {formatTime(selectedKeyframe.time)}
              </span>
              <button
                onClick={() => handleRemoveKeyframe(selectedKeyframe.id)}
                className="p-0.5 rounded hover:bg-red-900/50 text-red-400"
                title="Delete keyframe"
              >
                <TrashIcon size={10} />
              </button>
            </div>

            {/* Transform controls */}
            <div className="grid grid-cols-2 gap-2">
              {/* Scale */}
              <div className="flex items-center gap-1">
                <label className="text-[9px] text-muted w-10">Scale</label>
                <input
                  type="number"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={selectedKeyframe.transforms.scale}
                  onChange={(e) => handleKeyframeTransformChange(selectedKeyframe.id, 'scale', parseFloat(e.target.value) || 1)}
                  className="flex-1 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
                />
              </div>

              {/* Opacity */}
              <div className="flex items-center gap-1">
                <label className="text-[9px] text-muted w-10">Opacity</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={selectedKeyframe.transforms.opacity}
                  onChange={(e) => handleKeyframeTransformChange(selectedKeyframe.id, 'opacity', parseInt(e.target.value, 10) || 100)}
                  className="flex-1 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
                />
              </div>

              {/* Offset X */}
              <div className="flex items-center gap-1">
                <label className="text-[9px] text-muted w-10">Off X</label>
                <input
                  type="number"
                  min={-100}
                  max={100}
                  step={1}
                  value={selectedKeyframe.transforms.offsetX}
                  onChange={(e) => handleKeyframeTransformChange(selectedKeyframe.id, 'offsetX', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
                />
              </div>

              {/* Offset Y */}
              <div className="flex items-center gap-1">
                <label className="text-[9px] text-muted w-10">Off Y</label>
                <input
                  type="number"
                  min={-100}
                  max={100}
                  step={1}
                  value={selectedKeyframe.transforms.offsetY}
                  onChange={(e) => handleKeyframeTransformChange(selectedKeyframe.id, 'offsetY', parseFloat(e.target.value) || 0)}
                  className="flex-1 px-1 py-0.5 text-[10px] rounded bg-bg-elevated border border-border-medium text-foreground"
                />
              </div>

              {/* Rotation */}
              <div className="flex items-center gap-1 col-span-2">
                <label className="text-[9px] text-muted w-10">Rotate</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={selectedKeyframe.transforms.rotation}
                  onChange={(e) => handleKeyframeTransformChange(selectedKeyframe.id, 'rotation', parseInt(e.target.value, 10))}
                  className="flex-1"
                  style={{ accentColor: NODE_COLORS.timeline }}
                />
                <span className="text-[9px] text-muted w-8">{selectedKeyframe.transforms.rotation}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="flex justify-between text-[9px] text-muted">
          <span>{keyframes.length} keyframes</span>
          <span>{frameCount} frames</span>
        </div>
      </div>
    </BaseNode>
  );
}
