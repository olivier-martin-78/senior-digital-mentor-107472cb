
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Check } from 'lucide-react';

interface MediaUploaderProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: boolean;
  uploadErrors: string[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ handleFileUpload, uploadingFiles, uploadErrors }) => {
  const [dragActive, setDragActive] = useState(false);
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Create a synthetic event to pass to handleFileUpload
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        Array.from(e.dataTransfer.files).forEach(file => {
          dataTransfer.items.add(file);
        });
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }
  };

  return (
    <div>
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <Label htmlFor="media-upload" className="cursor-pointer">
          <div className={`flex items-center justify-center border-2 ${dragActive ? 'border-tranches-sage bg-tranches-sage/10' : 'border-dashed border-gray-300'} rounded-lg p-6 hover:border-tranches-sage transition-colors`}>
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Cliquez ou glissez-déposez pour ajouter des images ou vidéos</p>
              <p className="text-xs text-gray-500 mt-1">Formats supportés: JPG, PNG, GIF, MP4, etc.</p>
            </div>
          </div>
          <Input
            id="media-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploadingFiles}
          />
        </Label>
      </div>

      {uploadingFiles && (
        <div className="flex justify-center my-4">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Téléchargement en cours...</span>
          </div>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md my-4">
          <h3 className="font-medium mb-1">Erreurs d'upload:</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {uploadErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
