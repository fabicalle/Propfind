'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { searchAddresses, type AddressSuggestion } from '@/lib/geocoding';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (newValue.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await searchAddresses(newValue);
          setSuggestions(results);
          setIsOpen(results.length > 0);
        } catch {
          // ignore
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lon);
      onChange(suggestion.display_name, lat, lng);
      setIsOpen(false);
      setSuggestions([]);
    },
    [onChange]
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder || 'Ej: Av. Corrientes 1234, CABA'}
          className="w-full rounded-lg bg-card border border-border-subtle px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-all focus:ring-2 focus:ring-brand-terracotta"
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <motion.div
              className="h-4 w-4 rounded-full border-2 border-border-subtle border-t-brand-terracotta"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-card shadow-xl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={motionTokens.spring.snappy}
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-2 text-left text-sm text-content-primary transition-colors hover:bg-app"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, ...motionTokens.spring.gentle }}
              >
                {suggestion.display_name}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
