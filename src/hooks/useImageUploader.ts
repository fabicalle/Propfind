import { useState, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';

export interface ImagePreview {
  id: string;
  url: string;
  file?: File;
}

interface UseImageUploaderOptions {
  bucketName?: string;
}

export function useImageUploader({ bucketName = 'property-images' }: UseImageUploaderOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null, onChange: (images: ImagePreview[]) => void, currentImages: ImagePreview[]) => {
      if (!files?.length) return;
      setUploading(true);

      try {
        const newImages: ImagePreview[] = [];

        for (const file of Array.from(files)) {
          if (!file.type.startsWith('image/')) continue;

          const previewUrl = URL.createObjectURL(file);
          newImages.push({ id: crypto.randomUUID(), url: previewUrl, file });
        }

        onChange([...currentImages, ...newImages]);
      } catch {
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const uploadToSupabase = useCallback(
    async (image: ImagePreview): Promise<string> => {
      const supabase = createSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      if (!image.file) {
        return image.url;
      }

      const fileExt = image.file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      const { error } = await supabase.storage.from(bucketName).upload(filePath, image.file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw error;

      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data.publicUrl;
    },
    [bucketName]
  );

  const uploadImages = useCallback(
    async (images: ImagePreview[], onChange: (images: ImagePreview[]) => void) => {
      setUploading(true);
      try {
        const supabase = createSupabaseClient();
        if (!supabase) return;

        const urls: string[] = [];
        for (const image of images) {
          const publicUrl = await uploadToSupabase(image);
          urls.push(publicUrl);
        }
        onChange(images.filter((img) => !img.url.startsWith('blob:')));
      } catch {
      } finally {
        setUploading(false);
      }
    },
    [uploadToSupabase]
  );

  const removeImage = useCallback(
    (id: string, onChange: (images: ImagePreview[]) => void, currentImages: ImagePreview[]) => {
      onChange(currentImages.filter((img) => img.id !== id));
    },
    []
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number, onChange: (images: ImagePreview[]) => void, currentImages: ImagePreview[]) => {
      const updated = [...currentImages];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onChange(updated);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, onChange: (images: ImagePreview[]) => void, currentImages: ImagePreview[]) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files, onChange, currentImages);
    },
    [handleFiles]
  );

  return {
    uploading,
    dragOver,
    handleFiles,
    uploadToSupabase,
    uploadImages,
    removeImage,
    moveImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setDragOver,
  };
}
