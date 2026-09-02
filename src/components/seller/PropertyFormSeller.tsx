'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PropertyType, ListingType } from '@prisma/client';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import { ImageUploader, type ImagePreview } from '@/components/ImageUploader';
import { TextIngestPanel } from '@/components/seller/TextIngestPanel';
import { createSupabaseClient } from '@/lib/supabase/client';
import { motionTokens } from '@/lib/motion/tokens';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { csrfFetch } from '@/lib/security/csrfClient';

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Departamento' },
  { value: 'house', label: 'Casa' },
  { value: 'condo', label: 'Condo' },
  { value: 'land', label: 'Terreno' },
  { value: 'commercial', label: 'Comercial' },
];

const AMENITIES_LIST = [
  'Patio',
  'Lavandería',
  'Cocina',
  'Balcón',
  'Terraza',
  'Cochera',
  'Piscina',
  'Seguridad',
  'Aire acondicionado',
  'Calefacción',
  'Mascotas permitidas',
];

interface PropertyFormSellerProps {
  userId: string;
  draft: {
    contact?: { nombreCompleto: string; telefono: string; email: string };
    property?: Record<string, unknown>;
  };
  onSaveDraft: (draft: Record<string, unknown>) => void;
  onSuccess: () => void;
  onCancel?: () => void;
  propertyId?: string | null;
}

interface PropertyFormData {
  title: string;
  listingType: ListingType;
  propertyType: PropertyType;
  price: number;
  priceCurrency: 'ARS' | 'USD';
  expenses: number;
  address: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  listingSubType: string;
  creditApproved: boolean;
  parking: string;
  amenities: string[];
  description: string;
  images: ImagePreview[];
}

const INITIAL_FORM: PropertyFormData = {
  title: '',
  listingType: 'sale',
  propertyType: 'apartment',
  price: 0,
  priceCurrency: 'ARS',
  expenses: 0,
  address: '',
  neighborhood: '',
  city: '',
  lat: 0,
  lng: 0,
  rooms: 1,
  bedrooms: 1,
  bathrooms: 1,
  areaM2: 0,
  listingSubType: '',
  creditApproved: false,
  parking: 'any',
  amenities: [],
  description: '',
  images: [],
};

const fieldClasses = {
  base: 'w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200',
  focus: 'focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta',
  error: 'border border-brand-clay focus:ring-brand-clay focus:shadow-[0_0_0_4px_rgba(159,66,66,0.15)]',
  disabled: 'opacity-50 cursor-not-allowed',
};

export function PropertyFormSeller({ userId, draft, onSaveDraft, onSuccess, onCancel, propertyId }: PropertyFormSellerProps) {
  const router = useRouter();
  const [form, setForm] = useState<PropertyFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const isInternalUpdate = useRef(false);
  const draftPropertyRef = useRef<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    if (propertyId) {
      setSubmitting(true);
      fetch(`/api/properties/${propertyId}`)
        .then((res) => res.json())
        .then((result) => {
          const data = result.data || result;
          const imagesWithIds = (data.images || []).map((img: Record<string, unknown>, idx: number) => ({
            ...img,
            id: img.id || `${propertyId}-image-${idx}-${Date.now()}`,
          }));
          setForm((prev) => ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || '',
            price: data.price || 0,
            priceCurrency: data.priceCurrency || 'ARS',
            expenses: data.expenses || 0,
            address: data.address || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            lat: data.lat || 0,
            lng: data.lng || 0,
            rooms: data.rooms || 1,
            bedrooms: data.bedrooms || 1,
            bathrooms: data.bathrooms || 1,
            areaM2: data.areaM2 || 0,
            listingType: data.listingType || 'sale',
            propertyType: data.propertyType || 'apartment',
            listingSubType: data.listingSubType || '',
            creditApproved: data.creditApproved || false,
            parking: data.parking || 'any',
            amenities: data.amenities || [],
            images: imagesWithIds,
          }));
        })
        .catch(() => {
          setError('No se pudo cargar la propiedad para editar');
        })
        .finally(() => {
          setSubmitting(false);
        });
    }
  }, [propertyId]);

  useEffect(() => {
    if (draft.property && draftPropertyRef.current !== draft.property) {
      draftPropertyRef.current = draft.property;
      isInternalUpdate.current = true;
      setForm((prev) => {
        const next = { ...prev, ...(draft.property as Partial<PropertyFormData>) };
        return next;
      });
    }
  }, [draft.property]);

  const updateField = useCallback(
    (field: keyof PropertyFormData, value: unknown) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        return next;
      });
    },
    []
  );

  const toggleAmenity = useCallback((amenity: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        amenities: prev.amenities.includes(amenity) ? prev.amenities.filter((a) => a !== amenity) : [...prev.amenities, amenity],
      };
      return next;
    });
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleExtract = useCallback((data: Record<string, unknown>) => {
    setForm((prev) => {
      const next = { ...prev, ...data } as Partial<PropertyFormData>;
      const merged = { ...prev, ...next };
      return merged;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      const requiredFields: (keyof PropertyFormData)[] = ['title', 'price', 'priceCurrency', 'listingType', 'propertyType', 'description', 'address', 'neighborhood', 'city', 'areaM2', 'rooms', 'bathrooms'];
      const missing = requiredFields.filter((field) => {
        const value = form[field];
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'number') return value < 0 || Number.isNaN(value);
        return !value || (typeof value === 'string' && !value.trim());
      });

      if (form.images.length === 0) {
        missing.push('images' as keyof PropertyFormData);
      }

      if (missing.length > 0) {
        const touchedFields: Record<string, boolean> = {};
        missing.forEach((field) => {
          touchedFields[field] = true;
        });
        setTouched((prev) => ({ ...prev, ...touchedFields }));
        setError('Por favor, completá todos los campos requeridos para publicar.');
        setSubmitting(false);
        return;
      }

      try {
        const supabase = createSupabaseClient();
        if (!supabase) {
          setError('Error de configuración: faltan variables de entorno');
          setSubmitting(false);
          return;
        }

        const imageUrls: string[] = [];
        for (const image of form.images) {
          if (image.url.startsWith('blob:')) {
            if (!image.file) {
              imageUrls.push(image.url);
              continue;
            }

            const fileExt = image.file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `properties/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(filePath, image.file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
              throw uploadError;
            }

            const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
            imageUrls.push(data.publicUrl);
          } else {
            imageUrls.push(image.url);
          }
        }

        const endpoint = propertyId ? `/api/properties/${propertyId}` : '/api/properties';
        const method = propertyId ? 'PUT' : 'POST';

        const response = await csrfFetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            images: imageUrls.map((url) => ({ url, width: 800, height: 600, alt: form.title })),
            ...(propertyId ? {} : { userId }),
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error?.message || 'Error al guardar la propiedad');
        }

        const result = await response.json();
        onSuccess();
        router.push(propertyId ? '/perfil' : '/properties');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setSubmitting(false);
      }
    },
    [form, userId, onSuccess, router, propertyId]
  );

  const formFields = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Ej: Departamento 2 ambientes en Palermo', required: true },
    { key: 'price', label: 'Precio', type: 'number', placeholder: 'Ej: 150000', required: true },
    { key: 'priceCurrency', label: 'Moneda', type: 'select', placeholder: 'ARS', required: true },
    { key: 'expenses', label: 'Expensas', type: 'number', placeholder: 'Ej: 5000', required: false },
    { key: 'neighborhood', label: 'Barrio', type: 'text', placeholder: 'Ej: Palermo', required: true },
    { key: 'city', label: 'Ciudad', type: 'text', placeholder: 'Ej: CABA', required: true },
    { key: 'rooms', label: 'Ambientes', type: 'number', placeholder: 'Ej: 2', required: true },
    { key: 'bedrooms', label: 'Dormitorios', type: 'number', placeholder: 'Ej: 1', required: false },
    { key: 'bathrooms', label: 'Baños', type: 'number', placeholder: 'Ej: 1', required: true },
    { key: 'areaM2', label: 'Superficie (m²)', type: 'number', placeholder: 'Ej: 45', required: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.spring.gentle}
      className="mx-auto max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border-subtle bg-card p-8 shadow-xl">
        <motion.h2
          className="mb-6 text-2xl font-bold text-content-primary"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={motionTokens.spring.gentle}
        >
          Detalles de la propiedad
        </motion.h2>

        {error && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {formFields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 1, opacity: 1 }}
              transition={{ ...motionTokens.spring.gentle, delay: 0.1 + index * 0.03 }}
              className={field.key === 'title' ? 'col-span-2' : ''}
            >
               <label className="mb-2 block text-sm font-medium text-content-primary">{field.label}</label>
              {field.type === 'select' ? (
                 <select
                   value={form[field.key as keyof PropertyFormData] as string}
                   onChange={(e) => updateField(field.key as keyof PropertyFormData, e.target.value)}
                   onBlur={() => handleBlur(field.key)}
                   disabled={submitting}
                   required={field.required}
                   className={`${fieldClasses.base} ${fieldClasses.focus} ${
                     touched[field.key] && !form[field.key as keyof PropertyFormData] ? fieldClasses.error : ''
                   } ${submitting ? fieldClasses.disabled : ''}`}
                >
                  <option value="ARS">ARS - Peso argentino</option>
                  <option value="USD">USD - Dólar estadounidense</option>
                </select>
              ) : (
                <input
                  type={field.type}
                  min="0"
                  step={field.type === 'number' ? '0.01' : undefined}
                  value={String(form[field.key as keyof PropertyFormData] ?? '')}
                  onChange={(e) => {
                    const value = field.type === 'number' ? Number(e.target.value) : e.target.value;
                    updateField(field.key as keyof PropertyFormData, value);
                  }}
                   onBlur={() => handleBlur(field.key)}
                   placeholder={field.placeholder}
                   disabled={submitting}
                   required={field.required}
                   className={`${fieldClasses.base} ${fieldClasses.focus} ${
                     touched[field.key] && !form[field.key as keyof PropertyFormData] ? fieldClasses.error : ''
                   } ${submitting ? fieldClasses.disabled : ''}`}
                 />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.35 }}
        >
          <label className="mb-2 block text-sm font-medium text-content-primary">Dirección</label>
          <div className={`rounded-lg transition-all ${touched.address && !form.address ? 'border border-brand-clay' : ''}`}>
            <AddressAutocomplete
              value={form.address}
              onChange={(address, lat, lng) => {
                updateField('address', address);
                if (lat) updateField('lat', lat);
                if (lng) updateField('lng', lng);
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="mt-6 grid grid-cols-2 gap-4"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.4 }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-content-primary">Tipo de operación</label>
            <div className="grid grid-cols-2 gap-2">
              {(['sale', 'rent'] as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    updateField('listingType', type);
                    setTouched((prev) => ({ ...prev, listingType: true }));
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                    form.listingType === type
                      ? 'border-brand-terracotta bg-brand-terracotta text-white'
                      : touched.listingType && !form.listingType
                        ? 'border-brand-clay bg-app text-content-secondary'
                        : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                  }`}
                >
                  {type === 'sale' ? 'Venta' : 'Alquiler'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-content-primary">Tipo de propiedad</label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    updateField('propertyType', type.value);
                    setTouched((prev) => ({ ...prev, propertyType: true }));
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                    form.propertyType === type.value
                      ? 'border-brand-terracotta bg-brand-terracotta text-white'
                      : touched.propertyType && !form.propertyType
                        ? 'border-brand-clay bg-app text-content-secondary'
                        : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-6 grid grid-cols-2 gap-4"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.47 }}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-content-primary">Dormitorios</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
               onChange={(e) => updateField('bedrooms', Number(e.target.value))}
               onBlur={() => handleBlur('bedrooms')}
               placeholder="Ej: 1"
               disabled={submitting}
               className={`${fieldClasses.base} ${fieldClasses.focus} ${
                 touched.bedrooms && !form.bedrooms && form.bedrooms !== 0 ? fieldClasses.error : ''
               } ${submitting ? fieldClasses.disabled : ''}`}
             />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-content-primary">Cochera</label>
            <div className="grid grid-cols-3 gap-2">
              {(['any', '1+', '2+'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    updateField('parking', option);
                    setTouched((prev) => ({ ...prev, parking: true }));
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                    form.parking === option
                      ? 'border-brand-terracotta bg-brand-terracotta text-white'
                      : touched.parking && !form.parking
                        ? 'border-brand-clay bg-app text-content-secondary'
                        : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                  }`}
                >
                  {option === 'any' ? 'Ninguna' : option}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {form.listingType === 'sale' && (
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...motionTokens.spring.gentle, delay: 0.48 }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-content-primary">Apto crédito</label>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((option) => (
                  <button
                    key={String(option)}
                    type="button"
                    onClick={() => {
                      updateField('creditApproved', option);
                      setTouched((prev) => ({ ...prev, creditApproved: true }));
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      form.creditApproved === option
                        ? 'border-brand-terracotta bg-brand-terracotta text-white'
                        : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                    }`}
                  >
                    {option ? 'Sí' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            <div />
          </motion.div>
        )}

        {form.listingType === 'rent' && (
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...motionTokens.spring.gentle, delay: 0.48 }}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-content-primary">Tipo de alquiler</label>
              <div className="grid grid-cols-2 gap-2">
                {(['', 'temporal'] as const).map((option) => (
                  <button
                    key={option || 'standard'}
                    type="button"
                    onClick={() => {
                      updateField('listingSubType', option);
                      setTouched((prev) => ({ ...prev, listingSubType: true }));
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
                      form.listingSubType === option
                        ? 'border-brand-terracotta bg-brand-terracotta text-white'
                        : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                    }`}
                  >
                    {option === 'temporal' ? 'Temporal' : 'Estándar'}
                  </button>
                ))}
              </div>
            </div>
            <div />
          </motion.div>
        )}

        <motion.div
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.45 }}
        >
          <label className="mb-2 block text-sm font-medium text-content-primary">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES_LIST.map((amenity) => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95 ${
                  form.amenities.includes(amenity)
                    ? 'border-brand-terracotta bg-brand-terracotta text-white'
                    : 'border-border-subtle bg-app text-content-secondary hover:bg-brand-terracotta/10'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.5 }}
        >
          <label className="mb-2 block text-sm font-medium text-content-primary">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            onBlur={() => handleBlur('description')}
            placeholder="Describí tu propiedad..."
            rows={4}
            disabled={submitting}
            className={`${fieldClasses.base} ${fieldClasses.focus} resize-none`}
          />
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.55 }}
        >
          <label className="mb-2 block text-sm font-medium text-content-primary">Imágenes</label>
          <ImageUploader images={form.images} onChange={(images) => updateField('images', images)} />
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.6 }}
        >
          <TextIngestPanel onExtract={handleExtract} />
        </motion.div>

        {onCancel && (
          <motion.button
            type="button"
            onClick={onCancel}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border-subtle bg-card px-6 py-3 text-sm font-semibold text-content-secondary transition-colors hover:bg-app active:scale-[0.98]"
          >
            Cancelar
          </motion.button>
        )}

        <motion.button
          type="submit"
          disabled={submitting}
          whileTap={{ scale: 0.98 }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-terracotta/90 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-content-primary border-t-transparent" />
              Publicando...
            </>
          ) : (
            'Publicar propiedad'
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
