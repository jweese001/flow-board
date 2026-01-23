import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { EyeIcon, EyeOffIcon, CheckIcon } from '@/components/ui/Icons';
import type { ModelType, AspectRatio } from '@/types/nodes';

const MODEL_OPTIONS: { value: ModelType; label: string; provider: string }[] = [
  { value: 'mock', label: 'Mock', provider: 'No API' },
  { value: 'gemini-pro', label: 'Gemini 3 Pro', provider: 'Google' },
  { value: 'gemini-flash', label: 'Gemini 2.5 Flash', provider: 'Google' },
  { value: 'sd3-large', label: 'SD3 Large', provider: 'Stability AI' },
  { value: 'sd3-large-turbo', label: 'SD3 Large Turbo', provider: 'Stability AI' },
  { value: 'sd3-medium', label: 'SD3 Medium', provider: 'Stability AI' },
  { value: 'sdxl-1.0', label: 'SDXL 1.0', provider: 'Stability AI' },
  { value: 'flux-schnell', label: 'Flux Schnell', provider: 'fal.ai' },
  { value: 'flux-dev', label: 'Flux Dev', provider: 'fal.ai' },
  { value: 'turbo', label: 'Turbo', provider: 'fal.ai' },
  { value: 'sdxl-turbo', label: 'SDXL Turbo', provider: 'fal.ai' },
];

const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
  { value: '2:3', label: '2:3 Portrait' },
  { value: '3:2', label: '3:2 Landscape' },
];

export function SettingsSection() {
  const [showGemini, setShowGemini] = useState(false);
  const [showStability, setShowStability] = useState(false);
  const [showFal, setShowFal] = useState(false);

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const defaults = useSettingsStore((s) => s.defaults);
  const autoSaveEnabled = useSettingsStore((s) => s.autoSaveEnabled);
  const autoSaveToFileEnabled = useSettingsStore((s) => s.autoSaveToFileEnabled);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setDefaults = useSettingsStore((s) => s.setDefaults);
  const setAutoSaveEnabled = useSettingsStore((s) => s.setAutoSaveEnabled);
  const setAutoSaveToFileEnabled = useSettingsStore((s) => s.setAutoSaveToFileEnabled);

  return (
    <div style={{ padding: '0 16px 16px 16px' }}>
      {/* API Keys Section */}
      <SectionHeader>API Keys</SectionHeader>
      <div className="space-y-5 mb-6">
        <ApiKeyInput
          label="Gemini"
          value={apiKeys.gemini || ''}
          onChange={(val) => setApiKey('gemini', val)}
          show={showGemini}
          onToggleShow={() => setShowGemini(!showGemini)}
          placeholder="Paste your API key"
          helpText="Google AI Studio"
          helpUrl="https://aistudio.google.com/apikey"
        />
        <ApiKeyInput
          label="Stability AI"
          value={apiKeys.stability || ''}
          onChange={(val) => setApiKey('stability', val)}
          show={showStability}
          onToggleShow={() => setShowStability(!showStability)}
          placeholder="Paste your API key"
          helpText="Stability AI Platform"
          helpUrl="https://platform.stability.ai/account/keys"
        />
        <ApiKeyInput
          label="fal.ai"
          value={apiKeys.fal || ''}
          onChange={(val) => setApiKey('fal', val)}
          show={showFal}
          onToggleShow={() => setShowFal(!showFal)}
          placeholder="Paste your API key"
          helpText="fal.ai Dashboard"
          helpUrl="https://fal.ai/dashboard/keys"
        />
      </div>

      {/* Generation Defaults Section */}
      <SectionHeader>Generation Defaults</SectionHeader>
      <div className="space-y-4 mb-6">
        <SettingsField label="Model">
          <SettingsSelect
            value={defaults.model}
            onChange={(val) => setDefaults({ model: val as ModelType })}
            options={MODEL_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} (${opt.provider})`,
            }))}
          />
        </SettingsField>
        <SettingsField label="Aspect Ratio">
          <SettingsSelect
            value={defaults.aspectRatio}
            onChange={(val) => setDefaults({ aspectRatio: val as AspectRatio })}
            options={ASPECT_RATIO_OPTIONS}
          />
        </SettingsField>
      </div>

      {/* Auto-save Section */}
      <SectionHeader>Auto-save</SectionHeader>
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer py-1">
          <div>
            <span className="text-sm text-secondary">Browser backup</span>
            <p className="text-xs text-muted">Save to localStorage every 2s</p>
          </div>
          <ToggleSwitch
            checked={autoSaveEnabled}
            onChange={setAutoSaveEnabled}
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer py-1">
          <div>
            <span className="text-sm text-secondary">File sync</span>
            <p className="text-xs text-muted">Also write to open file</p>
          </div>
          <ToggleSwitch
            checked={autoSaveToFileEnabled}
            onChange={setAutoSaveToFileEnabled}
          />
        </label>
      </div>
    </div>
  );
}

// --- Subcomponents ---

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-wider mb-3 mt-1"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </div>
  );
}

interface ApiKeyInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  helpText: string;
  helpUrl: string;
}

function ApiKeyInput({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  helpText,
  helpUrl,
}: ApiKeyInputProps) {
  const hasValue = value.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary">{label}</span>
        {hasValue && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckIcon size={12} />
            Connected
          </span>
        )}
      </div>

      <div
        className="flex items-center rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-bg-elevated)',
          border: hasValue
            ? '1px solid rgba(52, 211, 153, 0.4)'
            : '1px solid var(--color-border-subtle)',
        }}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-sm text-primary font-mono placeholder:text-muted"
        />
        <button
          onClick={onToggleShow}
          className="px-4 py-3 text-muted hover:text-primary transition-colors"
          type="button"
        >
          {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>

      <a
        href={helpUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-2 text-xs text-muted hover:text-primary transition-colors"
      >
        Get key from
        <span className="underline underline-offset-2">{helpText}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}

interface SettingsFieldProps {
  label: string;
  children: React.ReactNode;
}

function SettingsField({ label, children }: SettingsFieldProps) {
  return (
    <div>
      <label className="block text-sm text-secondary mb-2">{label}</label>
      {children}
    </div>
  );
}

interface SettingsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SettingsSelect({ value, onChange, options }: SettingsSelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg text-sm text-primary outline-none cursor-pointer appearance-none"
        style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-subtle)',
          padding: '12px 44px 12px 16px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200"
      style={{
        background: checked
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'var(--color-bg-elevated)',
        border: checked ? 'none' : '1px solid var(--color-border-subtle)',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{
          transform: checked ? 'translateX(22px)' : 'translateX(4px)',
        }}
      />
    </button>
  );
}
