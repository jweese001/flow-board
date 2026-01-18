import { useHistoryStore, type HistoryEntry } from '@/stores/historyStore';
import { TrashIcon, ClipboardIcon } from '@/components/ui/Icons';

const MODEL_LABELS: Record<string, string> = {
  mock: 'Mock',
  'gemini-pro': 'Gemini 3 Pro',
  'gemini-flash': 'Gemini 2.5 Flash',
  'flux-schnell': 'Flux Schnell',
  'flux-dev': 'Flux Dev',
  'turbo': 'Turbo',
  'sdxl-turbo': 'SDXL Turbo',
};

export function HistorySection() {
  const entries = useHistoryStore((s) => s.entries);
  const removeEntry = useHistoryStore((s) => s.removeEntry);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (entries.length === 0) {
    return (
      <div style={{ padding: '0 16px 16px 16px' }}>
        <p className="text-sm text-muted italic">
          No generations yet. Images will appear here after you generate them.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 16px 16px' }}>
      {/* Header with clear button */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          {entries.length} generation{entries.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={clearHistory}
          className="text-[10px] text-muted hover:text-error transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* History entries */}
      <div className="space-y-3">
        {entries.slice(0, 10).map((entry) => (
          <HistoryCard
            key={entry.id}
            entry={entry}
            onCopyPrompt={() => copyPrompt(entry.prompt)}
            onDelete={() => removeEntry(entry.id)}
            formatTime={formatTime}
          />
        ))}
      </div>

      {entries.length > 10 && (
        <p className="text-[10px] text-muted mt-3 text-center">
          + {entries.length - 10} more in history
        </p>
      )}
    </div>
  );
}

interface HistoryCardProps {
  entry: HistoryEntry;
  onCopyPrompt: () => void;
  onDelete: () => void;
  formatTime: (timestamp: number) => string;
}

function HistoryCard({ entry, onCopyPrompt, onDelete, formatTime }: HistoryCardProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video">
        <img
          src={entry.imageUrl}
          alt="Generated"
          className="w-full h-full object-cover"
        />
        {/* Overlay with actions */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        >
          <button
            onClick={onCopyPrompt}
            className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
            title="Copy prompt"
          >
            <ClipboardIcon size={14} className="text-white" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-md bg-white/10 hover:bg-red-500/50 transition-colors"
            title="Delete"
          >
            <TrashIcon size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-secondary">
            {MODEL_LABELS[entry.model] || entry.model}
          </span>
          <span className="text-[10px] text-muted">
            {formatTime(entry.timestamp)}
          </span>
        </div>
        {entry.seed !== undefined && (
          <span className="text-[10px] text-muted font-mono">
            seed: {entry.seed}
          </span>
        )}
        <p
          className="text-[10px] text-muted mt-1 line-clamp-2"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {entry.prompt}
        </p>
      </div>
    </div>
  );
}
