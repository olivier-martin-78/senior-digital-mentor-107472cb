import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GameSound } from '@/types/audioMemoryGame';

export const useAudioMemoryAdmin = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadSound = async (
    file: File,
    name: string,
    description: string,
    category: GameSound['category'],
    type: GameSound['type'],
    baseSoundId?: string
  ) => {
    try {
      setIsUploading(true);

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomId}.${fileExtension}`;

      console.log('📤 Uploading audio file:', fileName);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-memory-sounds')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded successfully:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-memory-sounds')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', urlData.publicUrl);

      // Save metadata to database
      const { data: dbData, error: dbError } = await supabase
        .from('audio_memory_game_sounds')
        .insert({
          name,
          description,
          file_url: urlData.publicUrl,
          category,
          type,
          base_sound_id: baseSoundId || null
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        // Delete uploaded file if database insert fails
        await supabase.storage
          .from('audio-memory-sounds')
          .remove([fileName]);
        throw dbError;
      }

      console.log('✅ Sound saved to database:', dbData);

      toast({
        title: "Son uploadé avec succès",
        description: `Le son "${name}" a été ajouté au jeu.`,
      });

      return dbData;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Erreur d'upload",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteSound = async (soundId: string, fileUrl: string) => {
    try {
      console.log('🗑️ Deleting sound:', soundId);

      // Extract filename from URL
      const fileName = fileUrl.split('/').pop();
      if (!fileName) {
        throw new Error('Invalid file URL');
      }

      // Delete from database first
      const { error: dbError } = await supabase
        .from('audio_memory_game_sounds')
        .delete()
        .eq('id', soundId);

      if (dbError) {
        console.error('❌ Database delete error:', dbError);
        throw dbError;
      }

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('audio-memory-sounds')
        .remove([fileName]);

      if (storageError) {
        console.error('❌ Storage delete error:', storageError);
        // Don't throw here as the database record is already deleted
      }

      console.log('✅ Sound deleted successfully');

      toast({
        title: "Son supprimé",
        description: "Le son a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('❌ Delete failed:', error);
      toast({
        title: "Erreur de suppression",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    uploadSound,
    deleteSound,
    isUploading
  };
};