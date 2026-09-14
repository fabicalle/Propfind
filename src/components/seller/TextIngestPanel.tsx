'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';

interface TextIngestPanelProps {
  onExtract: (data: Record<string, unknown>) => void;
}

interface ExtractedField {
  label: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}

export function TextIngestPanel({ onExtract }: TextIngestPanelProps) {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedField[]>([]);

  const parseText = useCallback(() => {
    const fields: ExtractedField[] = [];

    const priceMatch = text.match(/\$[\s]*([\d\.]+)/);
    if (priceMatch) {
      fields.push({ label: 'Precio', value: priceMatch[1].replace(/\./g, ''), confidence: 'high' });
    }

    const roomsMatch = text.match(/(\d+)\s*(ambientes|dormitorios|habitaciones)/i);
    if (roomsMatch) {
      fields.push({ label: 'Ambientes', value: roomsMatch[1], confidence: 'high' });
    }

    const bathroomsMatch = text.match(/(\d+)\s*(baños|baño|toilettes?)/i);
    if (bathroomsMatch) {
      fields.push({ label: 'Baños', value: bathroomsMatch[1], confidence: 'high' });
    }

    const areaMatch = text.match(/(\d+)\s*m2/i);
    if (areaMatch) {
      fields.push({ label: 'Superficie (m²)', value: areaMatch[1], confidence: 'high' });
    }

    const expensesMatch = text.match(/(expensas?)[\s:]*\$?[\s]*([\d\.]+)/i);
    if (expensesMatch) {
      fields.push({ label: 'Expensas', value: expensesMatch[2].replace(/\./g, ''), confidence: 'medium' });
    }

    setExtracted(fields);

    const data: Record<string, unknown> = {};
    fields.forEach((f) => {
      data[f.label] = f.value;
    });
    onExtract(data);
  }, [text, onExtract]);

  return (
     <div className="mt-6 rounded-2xl border border-border-subtle bg-card p-6 shadow-xl">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
           <h3 className="text-lg font-semibold text-content-primary">¿Querés agregar más características?</h3>
           <p className="mt-1 text-sm text-content-secondary">
            Pegá la descripción de la propiedad y extraemos los datos automáticamente.
          </p>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ ease: motionTokens.easing.natural }}
           className="text-content-secondary"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: motionTokens.easing.natural }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ej: Departamento 3 ambientes en Palermo, precio USD 180.000, expensas $8.000, 2 baños, 55 m2..."
                 className="h-32 w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-all focus:ring-2 focus:ring-brand-terracotta focus:shadow-[0_0_0_4px_rgba(200,109,81,0.15)]"
              />

              <div className="flex items-center gap-3">
                <motion.button
                  type="button"
                  onClick={parseText}
                  whileTap={{ scale: 0.98 }}
                   className="rounded-lg bg-card px-4 py-2 text-sm font-semibold text-content-primary transition-colors hover:bg-app"
                >
                  Extraer datos
                </motion.button>

                {extracted.length > 0 && (
                   <span className="text-xs text-content-secondary">
                    {extracted.length} campo{extracted.length > 1 ? 's' : ''} detectado
                    {extracted.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {extracted.length > 0 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {extracted.map((field) => (
                       <div key={field.label} className="rounded-lg border border-border-subtle bg-app px-3 py-2">
                         <p className="text-xs text-content-secondary">{field.label}</p>
                         <p className="text-sm font-medium text-content-primary">{field.value}</p>
                        <span
                           className={`text-[10px] uppercase tracking-wide ${
                             field.confidence === 'high'
                               ? 'text-emerald-400'
                               : field.confidence === 'medium'
                                 ? 'text-yellow-400'
                                 : 'text-content-secondary'
                           }`}
                        >
                          {field.confidence === 'high' ? 'Alta' : field.confidence === 'medium' ? 'Media' : 'Baja'} confianza
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
