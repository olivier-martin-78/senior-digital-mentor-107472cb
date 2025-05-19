
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useBlogEditor } from '@/hooks/useBlogEditor';

// Import all the components we extracted
import CoverImageUploader from '@/components/blog/CoverImageUploader';
import AlbumSelector from '@/components/blog/AlbumSelector';
import CategorySelector from '@/components/blog/CategorySelector';
import MediaUploader from '@/components/blog/MediaUploader';
import MediaGallery from '@/components/blog/MediaGallery';
import { useAuth } from '@/contexts/AuthContext';

const BlogEditor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isEditing,
    loading,
    post,
    title,
    setTitle,
    content,
    setContent,
    albumId,
    setAlbumId,
    allCategories,
    setAllCategories,
    selectedCategories,
    setSelectedCategories,
    allAlbums,
    setAllAlbums,
    saving,
    handleSave,
    media,
    uploadingFiles,
    uploadErrors,
    handleFileUpload,
    deleteMedia,
    coverImage,
    setCoverImage,
    coverImageFile,
    setCoverImageFile,
    uploadingCoverImage
  } = useBlogEditor();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/blog')}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
            <Button
              className="bg-tranches-sage hover:bg-tranches-sage/90"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing && post?.published ? 'Mettre à jour' : 'Publier'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Title */}
          <div className="mb-6">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl mt-1"
              placeholder="Titre de l'article"
            />
          </div>

          {/* Cover Image */}
          <CoverImageUploader
            coverImage={coverImage}
            setCoverImage={setCoverImage}
            setCoverImageFile={setCoverImageFile}
            uploadingCoverImage={uploadingCoverImage}
          />

          {/* Album Selection */}
          <AlbumSelector
            albumId={albumId}
            setAlbumId={setAlbumId}
            allAlbums={allAlbums}
            setAllAlbums={setAllAlbums}
            userId={user?.id}
          />

          {/* Categories Selection */}
          <CategorySelector
            allCategories={allCategories}
            setAllCategories={setAllCategories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />

          {/* Content */}
          <div className="mb-6">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] mt-1"
              placeholder="Contenu de l'article..."
            />
          </div>

          {/* Media Upload - only show if post is already saved */}
          {(isEditing || post) && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-serif mb-4">Médias</h2>
              
              <div className="mb-6">
                <MediaUploader
                  handleFileUpload={handleFileUpload}
                  uploadingFiles={uploadingFiles}
                  uploadErrors={uploadErrors}
                />
              </div>

              {/* Media Gallery */}
              <MediaGallery 
                media={media} 
                deleteMedia={deleteMedia} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
