
export interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
  name?: string;
}

export interface MediaUploaderProps {
  onMediaChange: (files: MediaFile[]) => void;
  existingMediaFiles?: MediaFile[];
}
