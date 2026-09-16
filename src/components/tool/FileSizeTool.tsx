'use client';

/**
 * The file size tool widget.
 *
 * Embedded on the homepage, every format hub and every landing page, with
 * props pre-setting the format and target size for that page.
 *
 * Privacy-critical: this component never sends the file anywhere. It reads the
 * File object, runs the pure engines in src/lib/engines, and creates an object
 * URL for download. The only fetch/beacon it makes is the metadata event in
 * lib/analytics-client (type, format, target size — nothing about the file).
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { SIZE_PRESETS, type PageFormat } from '@/config/target-pages';
import { formatBytes, parseTargetSize } from '@/lib/engines/bytes';
import { processFile, type EngineMode, type ProcessResult } from '@/lib/engines/browser';
import { track } from '@/lib/analytics-client';

interface FileSizeToolProps {
  format?: PageFormat;
  initialTargetBytes?: number;
  initialMode?: EngineMode;
  /** Shown above the dropzone; defaults to a format-appropriate line. */
  heading?: string;
}

const ACCEPT: Record<PageFormat, string> = {
  jpg: 'image/jpeg,.jpg,.jpeg',
  png: 'image/png,.png',
  pdf: 'application/pdf,.pdf',
  any: 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf',
};

const ACCEPT_TEXT: Record<PageFormat, string> = {
  jpg: 'JPG or JPEG',
  png: 'PNG',
  pdf: 'PDF',
  any: 'JPG, PNG or PDF',
};

type Status = 'idle' | 'working' | 'done' | 'error';

export function FileSizeTool({
  format = 'any',
  initialTargetBytes,
  initialMode = 'pad',
  heading,
}: FileSizeToolProps) {
  const fileInputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<EngineMode>(initialMode);
  const [presetBytes, setPresetBytes] = useState<number | 'custom'>(
    initialTargetBytes ?? SIZE_PRESETS.find((p) => p.label === '100KB')!.bytes,
  );
  const [customValue, setCustomValue] = useState('');
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('KB');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const targetBytes = useMemo(() => {
    if (presetBytes === 'custom') return parseTargetSize(customValue, customUnit);
    return presetBytes;
  }, [presetBytes, customValue, customUnit]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setDownloadUrl(null);
  }, []);

  const onFile = useCallback(
    (next: File | null) => {
      reset();
      setFile(next);
      if (next) {
        track({
          type: 'file_selected',
          format: next.type.includes('pdf') ? 'pdf' : next.type.includes('png') ? 'png' : 'jpg',
          targetSize: targetBytes ?? undefined,
          mode,
        });
      }
    },
    [mode, reset, targetBytes],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  const run = useCallback(async () => {
    if (!file || !targetBytes) return;
    setStatus('working');
    setError(null);
    track({ type: 'process_started', format, targetSize: targetBytes, mode });

    try {
      // Yield a frame so the "Working…" state paints before the main-thread work.
      await new Promise((resolve) => setTimeout(resolve, 20));
      const output = await processFile(file, { targetBytes, mode });

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(output.blob);
      objectUrlRef.current = url;

      setDownloadUrl(url);
      setResult(output);
      setStatus('done');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong while processing this file.';
      setError(message);
      setStatus('error');
      track({ type: 'error', format, targetSize: targetBytes, mode });
    }
  }, [file, format, mode, targetBytes]);

  const onDownload = useCallback(() => {
    if (!result) return;
    track({
      type: 'download_completed',
      format: result.format,
      targetSize: result.finalSize,
      mode: result.mode,
    });
  }, [result]);

  const tooSmallTarget = Boolean(file && targetBytes && targetBytes <= file.size && mode === 'pad');

  return (
    <section
      aria-label="File size tool"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 to-white px-5 py-4 sm:px-7">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
          {heading ?? `Increase ${ACCEPT_TEXT[format]} file size`}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Runs entirely in this browser tab. Your file is never uploaded.
        </p>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        {/* Step 1 — file */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
            dragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'
          }`}
        >
          <input
            ref={inputRef}
            id={fileInputId}
            type="file"
            accept={ACCEPT[format]}
            aria-label={`Choose a ${ACCEPT_TEXT[format]} file to increase`}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="space-y-2">
              <p className="break-all text-sm font-medium text-slate-900">{file.name}</p>
              <p className="text-sm text-slate-500">Currently {formatBytes(file.size)}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Drag a {ACCEPT_TEXT[format]} file here, or
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Browse files
              </button>
              <p className="text-xs text-slate-500">Nothing is uploaded when you pick a file.</p>
            </div>
          )}
        </div>

        {/* Step 2 — target size */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fileInputId}-size`} className="block text-sm font-medium text-slate-700">
              Target file size
            </label>
            <select
              id={`${fileInputId}-size`}
              value={presetBytes === 'custom' ? 'custom' : String(presetBytes)}
              onChange={(e) => {
                reset();
                setPresetBytes(e.target.value === 'custom' ? 'custom' : Number(e.target.value));
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {SIZE_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.bytes}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom size…</option>
            </select>
          </div>

          {presetBytes === 'custom' ? (
            <div>
              <label htmlFor={`${fileInputId}-custom`} className="block text-sm font-medium text-slate-700">
                Exact amount
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id={`${fileInputId}-custom`}
                  inputMode="decimal"
                  value={customValue}
                  onChange={(e) => {
                    reset();
                    setCustomValue(e.target.value);
                  }}
                  placeholder="e.g. 120"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <select
                  aria-label="Unit"
                  value={customUnit}
                  onChange={(e) => {
                    reset();
                    setCustomUnit(e.target.value as 'KB' | 'MB');
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option>KB</option>
                  <option>MB</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <span className="block text-sm font-medium text-slate-700">Method</span>
              <ModeToggle mode={mode} onChange={(m) => { reset(); setMode(m); }} compact />
            </div>
          )}
        </div>

        {presetBytes === 'custom' && (
          <div>
            <span className="block text-sm font-medium text-slate-700">Method</span>
            <ModeToggle mode={mode} onChange={(m) => { reset(); setMode(m); }} />
          </div>
        )}

        {/* Step 3 — run */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={run}
            disabled={!file || !targetBytes || status === 'working'}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {status === 'working'
              ? 'Working…'
              : targetBytes
                ? `Increase to ${formatBytes(targetBytes)}`
                : 'Enter a target size'}
          </button>
          {file && targetBytes && (
            <p className="text-sm text-slate-500">
              {formatBytes(file.size)} → {formatBytes(targetBytes)}
            </p>
          )}
        </div>

        {tooSmallTarget && status === 'idle' && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your file is already {formatBytes(file!.size)}, which is at or above the target. This tool
            only makes files bigger — pick a larger target size.
          </p>
        )}

        {status === 'error' && error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        {status === 'done' && result && downloadUrl && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-semibold text-emerald-900">
              Done — your file is exactly {formatBytes(result.finalSize)} (
              {result.finalSize.toLocaleString()} bytes)
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Was {formatBytes(result.originalSize)}
              {result.newDimensions && result.originalDimensions
                ? `, ${result.originalDimensions.width}×${result.originalDimensions.height} → ${result.newDimensions.width}×${result.newDimensions.height}`
                : ''}
              .
            </p>
            {result.notes.map((note) => (
              <p key={note} className="mt-2 text-sm text-emerald-800">
                {note}
              </p>
            ))}
            <a
              href={downloadUrl}
              download={result.filename}
              onClick={onDownload}
              className="mt-3 inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Download {result.filename}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ModeToggle({
  mode,
  onChange,
  compact = false,
}: {
  mode: EngineMode;
  onChange: (mode: EngineMode) => void;
  compact?: boolean;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2">
      <ModeButton
        active={mode === 'pad'}
        onClick={() => onChange('pad')}
        title="Pad file size"
        subtitle={compact ? 'Image untouched' : 'Adds invisible data. The image is untouched.'}
      />
      <ModeButton
        active={mode === 'upscale'}
        onClick={() => onChange('upscale')}
        title="Increase resolution"
        subtitle={compact ? 'More pixels' : 'Redraws the image at more pixels, then pads to size.'}
      />
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-left transition ${
        active
          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
          : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      <span className="block text-sm font-medium text-slate-900">{title}</span>
      <span className="mt-0.5 block text-xs leading-snug text-slate-600">{subtitle}</span>
    </button>
  );
}
