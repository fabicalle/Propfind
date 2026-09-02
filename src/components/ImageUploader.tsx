'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { useImageUploader, type ImagePreview } from '@/hooks/useImageUploader';

interface ImageUploaderProps {
  images: ImagePreview[];
  onChange: (images: ImagePreview[]) => void;
  bucketName?: string;
}

export function ImageUploader({ images, onChange, bucketName }: ImageUploaderProps) {
  const {
    uploading,
    dragOver,
    handleFiles,
    uploadImages,
    removeImage,
    moveImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageUploader({ bucketName });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files, onChange, images);
    },
    [handleFiles, onChange, images]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-content-secondary">Imágenes</label>
        {uploading && <span className="text-xs text-content-secondary">Procesando...</span>}
      </div>

      <motion.div
        className={`grid grid-cols-2 gap-4 md:grid-cols-3 ${dragOver ? 'ring-2 ring-card/20 rounded-xl' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, onChange, images)}
      >
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-card/10 bg-content-primary"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={motionTokens.spring.snappy}
            >
              <img
                src={image.url}
                alt={`Preview ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-content-primary/60 opacity-0 transition-opacity group-hover:opacity-100">
                <motion.button
                  type="button"
                  onClick={() => moveImage(index, index - 1, onChange, images)}
                  disabled={index === 0}
                  className="rounded-full bg-brand-olive p-1.5 text-white hover:bg-brand-olive/80 disabled:opacity-30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => moveImage(index, index + 1, onChange, images)}
                  disabled={index === images.length - 1}
                  className="rounded-full bg-brand-olive p-1.5 text-white hover:bg-brand-olive/80 disabled:opacity-30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => removeImage(image.id, onChange, images)}
                  className="rounded-full bg-brand-clay/60 p-1.5 text-card hover:bg-brand-clay/80"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </div>
              <motion.div className="absolute bottom-2 left-2 rounded bg-content-primary/60 px-2 py-0.5 text-xs text-card">
                {index + 1}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.label
          className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 transition-colors ${
            dragOver
              ? 'border-card bg-content-primary'
              : 'border-dashed border-card/20 bg-content-primary hover:border-card/40 hover:bg-content-primary'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg className="h-8 w-8 text-card" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs text-card">Agregar foto</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </motion.label>
      </motion.div>

      {images.length > 0 && (
        <motion.button
          type="button"
          onClick={() => uploadImages(images, onChange)}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-content-primary transition-all hover:bg-app active:scale-[0.98] disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {uploading ? 'Subiendo...' : 'Subir imágenes a Supabase'}
        </motion.button>
      )}
    </div>
  );
}

export type { ImagePreview };
