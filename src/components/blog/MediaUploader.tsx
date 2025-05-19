
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';

interface MediaUploaderProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: boolean;
  uploadErrors: string[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ handleFileUpload, uploadingFiles, uploadErrors }) => {
  return (
    <div>
      <Label htmlFor="media-upload" className="cursor-pointer">
        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-tranches-sage transition-colors">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">Cliquez pour ajouter des images ou vidéos</p>
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

      {uploadingFiles && (
        <div className="flex justify-center my-4">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Téléchargement en cours...</span>
          </div>
        </div>
      )}

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
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
