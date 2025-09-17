import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { useFitnessCategories } from '@/hooks/useFitnessCategories';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Eye, Upload } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { FitnessArticle } from '@/types/fitness';

const FitnessArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useOptionalAuth();
  const { toast } = useToast();
  
  // Redirect to auth if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);
  const { categories, createCategory } = useFitnessCategories();

  const [article, setArticle] = useState<Partial<FitnessArticle>>({
    title: '',
    subtitle: '',
    content: '',
    category_id: '',
    image_url: '',
    source: '',
    published: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Load existing article if editing
  useEffect(() => {
    if (id && id !== 'new') {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fitness_articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) throw error;

      setArticle(data);
    } catch (error: any) {
      console.error('Error loading article:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'article',
        variant: 'destructive',
      });
      navigate('/fitness');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `fitness-articles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(filePath);

      setArticle(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: 'Succès',
        description: 'Image uploadée avec succès',
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'upload de l\'image',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (publish = false) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté',
        variant: 'destructive',
      });
      return;
    }

    if (!article.title || !article.content || !article.category_id) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const articleData = {
        title: article.title!,
        subtitle: article.subtitle || null,
        content: article.content!,
        category_id: article.category_id!,
        image_url: article.image_url || null,
        source: article.source || null,
        author_id: user.id,
        published: publish || article.published || false
      };

      let result;
      if (id && id !== 'new') {
        result = await supabase
          .from('fitness_articles')
          .update(articleData)
          .eq('id', id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('fitness_articles')
          .insert(articleData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({
        title: 'Succès',
        description: publish ? 'Article publié avec succès' : 'Article sauvegardé',
      });

      navigate('/fitness');
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const result = await createCategory(newCategoryName);
    if (result) {
      setArticle(prev => ({ ...prev, category_id: result.id }));
      setNewCategoryName('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            {id && id !== 'new' ? 'Modifier l\'article' : 'Nouvel article "Rester en forme"'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={article.title || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de l'article"
            />
          </div>

          {/* Subtitle */}
          <div>
            <Label htmlFor="subtitle">Sous-titre</Label>
            <Input
              id="subtitle"
              value={article.subtitle || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Sous-titre de l'article"
            />
          </div>

          {/* Source */}
          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={article.source || ''}
              onChange={(e) => setArticle(prev => ({ ...prev, source: e.target.value }))}
              placeholder="Source de l'article (optionnel)"
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Catégorie *</Label>
            <div className="flex gap-2">
              <Select 
                value={article.category_id || ''} 
                onValueChange={(value) => setArticle(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Create new category */}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Nouvelle catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label htmlFor="image">Image</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {article.image_url && (
                <div>
                  <img 
                    src={article.image_url} 
                    alt="Aperçu" 
                    className="max-w-xs h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Contenu *</Label>
            <div className="mt-2">
              <ReactQuill
                theme="snow"
                value={article.content || ''}
                onChange={(value) => setArticle(prev => ({ ...prev, content: value }))}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ],
                }}
              />
            </div>
          </div>

          {/* Published Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={article.published || false}
              onCheckedChange={(checked) => setArticle(prev => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published">Publié</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={() => handleSave(false)} 
              disabled={saving}
              variant="outline"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Sauvegarder
            </Button>
            
            <Button 
              onClick={() => handleSave(true)} 
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              Publier
            </Button>
            
            <Button 
              onClick={() => navigate('/fitness')} 
              variant="ghost"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessArticleEditor;