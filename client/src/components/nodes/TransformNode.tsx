import { useCallback } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import type { TransformNode as TransformNodeType, ImageAlignment } from '@/types/nodes';
import { BaseNode } from './BaseNode';
import { TransformIcon } from '../ui/Icons';
import { useFlowStore } from '@/stores/flowStore';

const ALIGNMENT_OPTIONS: { value: ImageAlignment; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'left', label: '←' },
  { value: 'center', label: '•' },
  { value: 'right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom', label: '↓' },
  { value: 'bottom-right', label: '↘' },
];

// Refined slider with better visual weight
function NodeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = '',
  accentColor = 'var(--color-node-transform)',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix?: string;
  accentColor?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-secondary w-14 shrink-0">{label}</span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-black/30" />
        {/* Track fill */}
        <div
          className="absolute h-1 rounded-full transition-all duration-75"
          style={{ width: `${percentage}%`, background: accentColor, opacity: 0.7 }}
        />
        {/* Input overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
        />
        {/* Thumb */}
        <div
          className="absolute w-2 h-2 rounded-full shadow-sm pointer-events-none transition-all duration-75"
          style={{
            left: `calc(${percentage}% - 4px)`,
            background: accentColor,
            boxShadow: `0 0 4px ${accentColor}50`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-primary w-10 text-right tabular-nums">
        {value}{suffix}
      </span>
    </div>
  );
}

// Centered slider for values that range from negative to positive (0 in center)
function CenteredSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  accentColor = 'var(--color-node-transform)',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  accentColor?: string;
}) {
  // Position as percentage (0 at center = 50%)
  const percentage = ((value - min) / (max - min)) * 100;
  // Fill from center (50%) to current position
  const fillStart = Math.min(50, percentage);
  const fillEnd = Math.max(50, percentage);
  const fillWidth = fillEnd - fillStart;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-secondary w-14 shrink-0">{label}</span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1 rounded-full bg-black/30" />
        {/* Center mark */}
        <div
          className="absolute h-2 w-px bg-white/20"
          style={{ left: '50%' }}
        />
        {/* Track fill from center */}
        <div
          className="absolute h-1 rounded-full transition-all duration-75"
          style={{
            left: `${fillStart}%`,
            width: `${fillWidth}%`,
            background: accentColor,
            opacity: 0.7,
          }}
        />
        {/* Input overlay */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-0 w-full opacity-0 cursor-ew-resize"
        />
        {/* Thumb */}
        <div
          className="absolute w-2 h-2 rounded-full shadow-sm pointer-events-none transition-all duration-75"
          style={{
            left: `calc(${percentage}% - 4px)`,
            background: accentColor,
            boxShadow: `0 0 4px ${accentColor}50`,
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-primary w-8 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

// Section wrapper for visual grouping
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-2.5 py-2 rounded-md bg-black/15 ${className}`}>
      {children}
    </div>
  );
}

export function TransformNode({ id, data, selected }: NodeProps<TransformNodeType>) {
  const updateNodeData = useFlowStore((s) => s.updateNodeData);

  const scale = data.scale ?? 1;
  const offsetX = data.offsetX ?? 0;
  const offsetY = data.offsetY ?? 0;
  const rotation = data.rotation ?? 0;
  const opacity = data.opacity ?? 100;
  const flipH = data.flipH ?? false;
  const flipV = data.flipV ?? false;
  const alignment = data.alignment ?? 'center';

  const handleChange = useCallback(
    (field: string, value: number | boolean | string) => {
      updateNodeData(id, { [field]: value });
    },
    [id, updateNodeData]
  );

  const accentColor = '#f472b6'; // pink-400 for transform

  const timelineHandleStyle: React.CSSProperties = {
    background: 'var(--color-bg-panel)',
    borderColor: '#a855f7', // purple for timeline connection
    borderWidth: 2,
    width: 12,
    height: 12,
  };

  return (
    <BaseNode
      nodeId={id}
      nodeType="transform"
      name={data.name || 'Transform'}
      selected={selected}
      showTargetHandle={true}
      showSourceHandle={true}
      icon={<TransformIcon size={14} />}
      additionalHandles={
        <Handle
          type="target"
          position={Position.Bottom}
          id="timeline-in"
          style={{
            ...timelineHandleStyle,
          }}
        />
      }
    >
      <div className="space-y-2.5 nodrag">
        {/* Spatial Transforms Group */}
        <Section>
          <div className="space-y-2">
            <NodeSlider
              label="Scale"
              value={Math.round(scale * 100)}
              min={10}
              max={200}
              step={1}
              onChange={(v) => handleChange('scale', v / 100)}
              suffix="%"
              accentColor={accentColor}
            />
            <CenteredSlider
              label="Offset X"
              value={offsetX}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => handleChange('offsetX', v)}
              accentColor={accentColor}
            />
            <CenteredSlider
              label="Offset Y"
              value={offsetY}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => handleChange('offsetY', v)}
              accentColor={accentColor}
            />
            <NodeSlider
              label="Rotation"
              value={rotation}
              min={-180}
              max={180}
              step={1}
              onChange={(v) => handleChange('rotation', v)}
              suffix="°"
              accentColor={accentColor}
            />
          </div>
        </Section>

        {/* Opacity */}
        <Section>
          <NodeSlider
            label="Opacity"
            value={opacity}
            min={0}
            max={100}
            step={1}
            onChange={(v) => handleChange('opacity', v)}
            suffix="%"
            accentColor={accentColor}
          />
        </Section>

        {/* Flip & Alignment Group */}
        <Section className="space-y-2">
          <div className="flex items-center gap-3">
            {/* Flip controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-secondary">Flip</span>
              <button
                onClick={() => handleChange('flipH', !flipH)}
                className="w-6 h-6 text-[10px] font-semibold rounded transition-all"
                style={{
                  background: flipH ? accentColor : 'rgba(0,0,0,0.3)',
                  color: flipH ? 'white' : 'var(--color-text-muted)',
                  boxShadow: flipH ? `0 0 8px ${accentColor}40` : 'none',
                }}
                title="Flip Horizontal"
              >
                H
              </button>
              <button
                onClick={() => handleChange('flipV', !flipV)}
                className="w-6 h-6 text-[10px] font-semibold rounded transition-all"
                style={{
                  background: flipV ? accentColor : 'rgba(0,0,0,0.3)',
                  color: flipV ? 'white' : 'var(--color-text-muted)',
                  boxShadow: flipV ? `0 0 8px ${accentColor}40` : 'none',
                }}
                title="Flip Vertical"
              >
                V
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-white/10" />

            {/* Alignment grid */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-secondary">Align</span>
              <div className="grid grid-cols-3 gap-px p-0.5 rounded bg-black/30">
                {ALIGNMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('alignment', opt.value)}
                    className="w-4 h-4 text-[9px] rounded-sm transition-all flex items-center justify-center"
                    style={{
                      background: alignment === opt.value ? accentColor : 'transparent',
                      color: alignment === opt.value ? 'white' : 'var(--color-text-muted)',
                    }}
                    title={opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </BaseNode>
  );
}
