import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, ImagePlus } from 'lucide-react';
import { uploadFoto } from '@/services/upload';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onChange, maxPhotos = 5 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        if (photos.length + newPhotos.length >= maxPhotos) break;
        const result = await uploadFoto(file);
        newPhotos.push(result.file_url);
      }
      onChange([...photos, ...newPhotos]);
    } catch {
      // Upload error - silently ignore, user can retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative h-20 w-20 rounded-lg border overflow-hidden group">
              <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < maxPhotos && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              {uploading ? 'Caricamento...' : 'Scatta Foto'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => {
                // Create a second input without capture for gallery
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.multiple = true;
                input.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
                input.click();
              }}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Galleria
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
