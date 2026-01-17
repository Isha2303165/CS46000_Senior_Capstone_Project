import React, { useState, useCallback, useRef } from 'react';
import { debounce } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  containerClassName?: string;
}

interface NominatimResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Start typing an address...',
  error,
  required,
  helperText,
  containerClassName,
}) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5&countrycodes=us`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data: NominatimResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => searchAddress(query), 500),
    []
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    debouncedSearch(inputValue);
  };

  const handleSelect = (suggestion: NominatimResult) => {
    onChange(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const formatSuggestion = (result: NominatimResult): string => {
    // Format the address for display
    const parts = [];
    const addr = result.address;
    
    if (addr) {
      if (addr.house_number && addr.road) {
        parts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        parts.push(addr.road);
      }
      
      const city = addr.city || addr.town || addr.village;
      if (city) parts.push(city);
      
      if (addr.state) {
        if (addr.postcode) {
          parts.push(`${addr.state} ${addr.postcode}`);
        } else {
          parts.push(addr.state);
        }
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : result.display_name;
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
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className={`w-full border rounded-md px-3 py-2 ${error ? 'border-red-500' : ''}`}
        aria-invalid={!!error}
        aria-required={required}
        aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
        autoComplete="off"
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        onFocus={() => value.length > 2 && suggestions.length > 0 && setShowSuggestions(true)}
      />
      {error && (
        <div id={`${label}-error`} className="text-sm text-red-600 mt-1">{error}</div>
      )}
      {helperText && !error && (
        <div id={`${label}-helper`} className="text-sm text-muted-foreground mt-1">{helperText}</div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded-md shadow-lg w-full mt-1 max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 text-sm"
              onMouseDown={() => handleSelect(suggestion)}
            >
              <div className="font-medium">
                {formatSuggestion(suggestion).split(',')[0]}
              </div>
              <div className="text-gray-600 text-xs">
                {formatSuggestion(suggestion).split(',').slice(1).join(',')}
              </div>
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="absolute z-10 bg-white border rounded-md shadow w-full mt-1 px-3 py-2 text-sm text-gray-500">
          Loading suggestions...
        </div>
      )}
    </div>
  );
};
