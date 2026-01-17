import React, { useState, useRef, useEffect } from 'react';

interface MedicationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  containerClassName?: string;
}

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const MedicationAutocomplete: React.FC<MedicationAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error,
  required,
  helperText,
  containerClassName,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedValue = useDebounce(value, 300);
  const lastSelected = useRef<string | null>(null);

  useEffect(() => {
    if (!debouncedValue || debouncedValue.length < 2 || debouncedValue === lastSelected.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    fetch(`https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(debouncedValue)}&maxEntries=10`)
      .then(res => res.json())
      .then(data => {
        const matches: Array<{ name?: string }> = data.approximateGroup?.candidate || [];
        const names = matches.map((c) => c?.name).filter(Boolean) as string[];
        setSuggestions(Array.from(new Set(names)));
        setShowSuggestions(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    lastSelected.current = suggestion;
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={containerClassName} style={{ position: 'relative' }}>
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value ?? ""}
        onChange={handleInput}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 ${error ? 'border-red-500' : ''}`}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
        autoComplete="off"
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        onFocus={() => (typeof value === 'string' && value.length > 1 && suggestions.length > 0) && setShowSuggestions(true)}
      />
      {error && (
        <div id={`${label}-error`} className="text-sm text-red-600 mt-1">{error}</div>
      )}
      {helperText && !error && (
        <div id={`${label}-helper`} className="text-sm text-muted-foreground mt-1">{helperText}</div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded-md shadow w-full mt-1 max-h-48 overflow-auto">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => handleSelect(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <div className="absolute right-2 top-2 text-xs text-gray-400">Loading...</div>
      )}
    </div>
  );
};
