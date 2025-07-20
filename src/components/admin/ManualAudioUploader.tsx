import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface ManualAudioUploaderProps {
  youtubeUrl: string;
  onAudioExtracted: (audioUrl: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export const ManualAudioUploader: React.FC<ManualAudioUploaderProps> = ({
  youtubeUrl,
  onAudioExtracted
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.includes('audio/') || file.name.endsWith('.mp3')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Veuillez sélectionner un fichier audio MP3');
      }
    }
  };

  const uploadAudio = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setError(null);

    try {
      // Générer un nom de fichier unique
      const fileName = `manual_audio_${Date.now()}_${selectedFile.name}`;
      const filePath = `audio/${fileName}`;

      console.log('🔄 Uploading audio file to Supabase storage:', filePath);

      // Upload du fichier dans le bucket Supabase
      const { error: uploadError } = await supabase.storage
        .from('activity-thumbnails')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type || 'audio/mpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(filePath);

      console.log('✅ Audio uploaded successfully:', publicUrl);

      setUploadStatus('success');
      onAudioExtracted(publicUrl);

    } catch (error: any) {
      console.error('💥 Upload failed:', error);
      setError(error.message);
      setUploadStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  const getButtonVariant = () => {
    switch (uploadStatus) {
      case 'error':
        return 'destructive' as const;
      case 'success':
        return 'outline' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Upload Manuel Audio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Les services d'extraction automatique sont temporairement indisponibles. 
            Veuillez télécharger l'audio manuellement depuis YouTube et l'uploader ici.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="audio-file">Fichier Audio MP3</Label>
          <Input
            id="audio-file"
            type="file"
            accept=".mp3,audio/*"
            onChange={handleFileSelect}
            disabled={uploadStatus === 'uploading'}
          />
        </div>

        {selectedFile && (
          <div className="text-sm text-muted-foreground">
            Fichier sélectionné: {selectedFile.name} 
            ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}

        <Button
          onClick={uploadAudio}
          disabled={!selectedFile || uploadStatus === 'uploading'}
          variant={getButtonVariant()}
          className="w-full"
        >
          {getStatusIcon()}
          {uploadStatus === 'uploading' && 'Upload en cours...'}
          {uploadStatus === 'success' && 'Upload réussi!'}
          {uploadStatus === 'error' && 'Réessayer'}
          {uploadStatus === 'idle' && 'Uploader l\'audio'}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Fichier audio uploadé avec succès!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};