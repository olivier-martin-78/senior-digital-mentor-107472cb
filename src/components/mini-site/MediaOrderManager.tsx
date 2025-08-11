import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { MediaUploader } from './MediaUploader';

interface MediaItem {
  id?: string;
  media_url: string;
  caption: string;
  link_url: string;
  display_order: number;
  media_type: 'image' | 'video';
}

interface MediaOrderManagerProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
}

export const MediaOrderManager: React.FC<MediaOrderManagerProps> = ({
  media,
  onMediaChange,
}) => {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newMedia = [...media];
    [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
    // Mettre à jour les display_order
    newMedia.forEach((item, idx) => {
      item.display_order = idx;
    });
    onMediaChange(newMedia);
  };

  const moveDown = (index: number) => {
    if (index === media.length - 1) return;
    const newMedia = [...media];
    [newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]];
    // Mettre à jour les display_order
    newMedia.forEach((item, idx) => {
      item.display_order = idx;
    });
    onMediaChange(newMedia);
  };

  const updateCaption = (index: number, caption: string) => {
    const newMedia = [...media];
    newMedia[index].caption = caption;
    onMediaChange(newMedia);
  };

  const updateLink = (index: number, link_url: string) => {
    const newMedia = [...media];
    newMedia[index].link_url = link_url;
    onMediaChange(newMedia);
  };

  const removeMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    // Mettre à jour les display_order
    newMedia.forEach((item, idx) => {
      item.display_order = idx;
    });
    onMediaChange(newMedia);
  };

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {media.map((item, index) => (
        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
          {/* Aperçu du média */}
          <div className="flex-shrink-0">
            {item.media_type === 'video' ? (
              <video
                src={item.media_url}
                className="w-16 h-16 object-cover rounded border"
                muted
              />
            ) : (
              <img
                src={item.media_url}
                alt=""
                className="w-16 h-16 object-cover rounded border"
              />
            )}
          </div>

          {/* Champs d'édition */}
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Texte de la photo/vidéo"
              value={item.caption}
              onChange={(e) => updateCaption(index, e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Lien de la photo/vidéo (optionnel)"
              value={item.link_url}
              onChange={(e) => updateLink(index, e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Contrôles et remplacement */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => moveDown(index)}
                disabled={index === media.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Remplacer ce média */}
            <div className="px-2">
              <MediaUploader
                value=""
                accept="image/*,video/*"
                onChange={(url, mediaType = 'image') => {
                  const newMedia = [...media];
                  newMedia[index] = { ...newMedia[index], media_url: url, media_type: mediaType };
                  onMediaChange(newMedia);
                }}
              />
            </div>

            {/* Bouton de suppression */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeMedia(index)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};