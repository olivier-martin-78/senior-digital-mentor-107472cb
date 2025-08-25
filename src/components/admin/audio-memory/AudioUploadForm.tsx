import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, Music } from 'lucide-react';
import { useAudioMemoryAdmin } from '@/hooks/useAudioMemoryAdmin';
import { useAudioMemoryDB } from '@/hooks/useAudioMemoryDB';
import { GameSound } from '@/types/audioMemoryGame';

interface AudioUploadFormProps {
  onUploadSuccess: () => void;
}

export const AudioUploadForm: React.FC<AudioUploadFormProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GameSound['category'] | ''>('');
  const [type, setType] = useState<GameSound['type']>('original');
  const [baseSoundId, setBaseSoundId] = useState('');

  const { uploadSound, isUploading } = useAudioMemoryAdmin();
  const { sounds } = useAudioMemoryDB();

  const originalSounds = sounds.filter(sound => sound.type === 'original');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.includes('audio') && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
        alert('Veuillez sélectionner un fichier audio MP3');
        return;
      }
      setFile(selectedFile);
      
      // Auto-fill name if empty
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setName(fileName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !name || !category) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (type === 'variant' && !baseSoundId) {
      alert('Veuillez sélectionner un son de base pour une variante');
      return;
    }

    try {
      await uploadSound(
        file, 
        name, 
        description, 
        category as GameSound['category'], 
        type,
        type === 'variant' ? baseSoundId : undefined
      );
      
      // Reset form
      setFile(null);
      setName('');
      setDescription('');
      setCategory('');
      setType('original');
      setBaseSoundId('');
      
      // Reset file input
      const fileInput = document.getElementById('audio-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="audio-file">Fichier MP3 *</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/mp3,audio/mpeg"
              onChange={handleFileChange}
              className="mt-1"
              required
            />
            {file && (
              <Card className="mt-2">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Label htmlFor="name">Nom du son *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chien qui aboie"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du son..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as GameSound['category'])}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="animals">Animaux</SelectItem>
                <SelectItem value="onomatopoeia">Onomatopées</SelectItem>
                <SelectItem value="instruments">Instruments</SelectItem>
                <SelectItem value="music">Musique</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as GameSound['type'])}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Son original</SelectItem>
                <SelectItem value="variant">Variante d'un son</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'variant' && (
            <div>
              <Label htmlFor="base-sound">Son de base *</Label>
              <Select value={baseSoundId} onValueChange={setBaseSoundId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le son de base" />
                </SelectTrigger>
                <SelectContent>
                  {originalSounds.map((sound) => (
                    <SelectItem key={sound.id} value={sound.id}>
                      {sound.name} ({sound.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isUploading || !file || !name || !category}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Upload en cours...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Uploader le son
          </>
        )}
      </Button>
    </form>
  );
};