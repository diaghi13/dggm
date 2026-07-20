"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { resolveError, type ErrorProp } from "@/lib/utils/resolve-error";

// ---------------------------------------------------------------------------
// Locale configuration
// The app uses Italian locale: decimal separator = comma, thousands = dot
// DB / JS floats always use dot as decimal separator
// ---------------------------------------------------------------------------

const LOCALE = "it-IT";
const DECIMAL_SEPARATOR = ",";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Format a JS number to a locale-aware display string */
export function formatCurrency(
  value: number | null | undefined,
  options?: {
    decimals?: number;
    showThousands?: boolean;
  },
): string {
  if (value === null || value === undefined || isNaN(value)) return "";
  const decimals = options?.decimals ?? 2;
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: options?.showThousands !== false,
  });
}

/** Parse a locale-aware string back to a JS number (dot as decimal) */
export function parseCurrencyString(display: string): number | null {
  if (!display || display.trim() === "") return null;
  // Remove thousands separators (dot), replace decimal separator (comma) with dot
  const normalized = display
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

// ---------------------------------------------------------------------------
// CurrencyDisplay — read-only formatted value
// ---------------------------------------------------------------------------

interface CurrencyDisplayProps {
  value: number | null | undefined;
  currency?: string;
  showCurrency?: boolean;
  decimals?: number;
  className?: string;
  bold?: boolean;
  colorize?: boolean; // green for positive, red for negative
}

export function CurrencyDisplay({
  value,
  currency = "€",
  showCurrency = true,
  decimals = 2,
  className,
  bold = false,
  colorize = false,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(value, { decimals });

  if (!formatted) {
    return (
      <span className={cn("text-slate-400 dark:text-slate-500", className)}>
        —
      </span>
    );
  }

  const isNeg = (value ?? 0) < 0;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-0.5 tabular-nums",
        bold && "font-semibold",
        colorize && !isNeg && "text-emerald-600 dark:text-emerald-400",
        colorize && isNeg && "text-red-600 dark:text-red-400",
        className,
      )}
    >
      {showCurrency && (
        <span className="text-slate-400 dark:text-slate-500 text-[0.9em] mr-0.5">
          {currency}
        </span>
      )}
      {formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// CurrencyInput — editable text input with locale-aware formatting
// ---------------------------------------------------------------------------

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** JS number value (null = empty) */
  value: number | null | undefined;
  /** Called with parsed JS number (or null if empty/invalid) */
  onChange: (value: number | null) => void;
  currency?: string;
  showCurrency?: boolean;
  decimals?: number;
  /** Allow negative values (default false) */
  allowNegative?: boolean;
  className?: string;
  error?: ErrorProp;
}

export function CurrencyInput({
  value,
  onChange,
  currency = "€",
  showCurrency = true,
  decimals = 2,
  allowNegative = false,
  className,
  disabled,
  error,
  ...rest
}: CurrencyInputProps) {
  const errorMsg = resolveError(error);
  const inputRef = useRef<HTMLInputElement>(null);
  // Display string — initially formatted, then free-form while editing
  const [display, setDisplay] = useState<string>(() =>
    formatCurrency(value, { decimals }),
  );
  const [isFocused, setIsFocused] = useState(false);

  // Keep display in sync when value changes externally (not while user is typing)
  useEffect(() => {
    if (!isFocused) {
      setDisplay(formatCurrency(value, { decimals })); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [value, decimals, isFocused]);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw comma-decimal value on focus for easier editing
      if (value !== null && value !== undefined && !isNaN(value)) {
        // Replace dot thousands, show comma decimal
        const raw = value.toFixed(decimals).replace(".", DECIMAL_SEPARATOR);
        setDisplay(raw);
        // Select all text after a tick so browser doesn't override
        setTimeout(() => e.target.select(), 0);
      }
    },
    [value, decimals],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow only digits, commas, dots, minus (for negative)
      const allowedPattern = allowNegative ? /[^\d.,\-]/g : /[^\d.,]/g;
      const cleaned = raw.replace(allowedPattern, "");
      setDisplay(cleaned);

      // Try to parse immediately for live calculation
      const parsed = parseCurrencyString(cleaned);
      onChange(parsed);
    },
    [allowNegative, onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseCurrencyString(display);
    onChange(parsed);
    // Reformat on blur
    setDisplay(formatCurrency(parsed, { decimals }));
  }, [display, decimals, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        inputRef.current?.blur();
      }
    },
    [],
  );

  return (
    <>
      <div className="relative flex items-center">
        {showCurrency && (
          <span
            className={cn(
              "absolute left-2.5 text-xs text-slate-400 dark:text-slate-500 pointer-events-none select-none",
              disabled && "opacity-50",
            )}
          >
            {currency}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={!!errorMsg}
          className={cn(
            "flex h-9 w-full rounded-md border",
            errorMsg
              ? "border-destructive"
              : "border-slate-300 dark:border-slate-600",
            "bg-transparent px-3 py-1 text-sm text-right",
            "shadow-sm transition-colors",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showCurrency && "pl-7",
            className,
          )}
          {...rest}
        />
      </div>
      {errorMsg && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
      )}
    </>
  );
}