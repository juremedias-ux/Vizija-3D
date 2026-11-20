"use client";

export interface HistoryEntry {
  id: number;
  label: string;
  time: string;
}

export function HistoryPanel({
  entries,
  currentId,
  onRestore,
}: {
  entries: HistoryEntry[];
  currentId: number | null;
  onRestore: (id: number) => void;
}) {
  if (!entries.length) {
    return (
      <p className="text-sm text-fg-subtle">
        Spremembe se bodo prikazale tukaj.
      </p>
    );
  }
  return (
    <ol className="grid max-h-72 gap-1.5 overflow-y-auto pr-1">
      {[...entries].reverse().map((entry) => (
        <li
          key={entry.id}
          className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
            entry.id === currentId
              ? "bg-accent/10 text-fg ring-1 ring-accent/40"
              : "bg-surface-2 text-fg-muted"
          }`}
        >
          <span>
            <span className="block">{entry.label}</span>
            <span className="text-xs text-fg-subtle">{entry.time}</span>
          </span>
          {entry.id === currentId ? (
            <span className="text-xs font-medium text-accent">Trenutno</span>
          ) : (
            <button
              type="button"
              onClick={() => onRestore(entry.id)}
              className="min-h-9 rounded-full px-3 text-xs font-medium text-accent ring-1 ring-accent/40 hover:bg-accent/10"
            >
              Povrni
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}
