import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Globe, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface MiniSite {
  id: string;
  site_name: string;
  first_name: string;
  last_name: string;
  profession: string;
  city: string;
  is_published: boolean;
  user_id: string;
  display_name?: string;
  email?: string;
}

interface MiniSiteImportDialogProps {
  onImport: (sourceMiniSiteId: string) => Promise<void>;
  targetUserId: string | null;
  targetUserName?: string;
  disabled?: boolean;
}

export const MiniSiteImportDialog: React.FC<MiniSiteImportDialogProps> = ({
  onImport,
  targetUserId,
  targetUserName,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMiniSite, setSelectedMiniSite] = useState<MiniSite | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: miniSites, isLoading } = useQuery({
    queryKey: ['all-mini-sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mini_sites')
        .select(`
          id,
          site_name,
          first_name,
          last_name,
          profession,
          city,
          is_published,
          user_id,
          profiles!inner(display_name, email)
        `)
        .neq('user_id', targetUserId || '') // Exclure l'utilisateur cible
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(site => ({
        ...site,
        display_name: (site.profiles as any)?.display_name || '',
        email: (site.profiles as any)?.email || ''
      })) || [];
    },
    enabled: isOpen
  });

  const filteredMiniSites = miniSites?.filter(site => {
    const searchLower = searchQuery.toLowerCase();
    return (
      site.site_name.toLowerCase().includes(searchLower) ||
      site.first_name.toLowerCase().includes(searchLower) ||
      site.last_name.toLowerCase().includes(searchLower) ||
      site.profession.toLowerCase().includes(searchLower) ||
      site.city.toLowerCase().includes(searchLower) ||
      site.display_name?.toLowerCase().includes(searchLower) ||
      site.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleImport = async () => {
    if (!selectedMiniSite) return;

    setImporting(true);
    try {
      await onImport(selectedMiniSite.id);
      setIsOpen(false);
      setSelectedMiniSite(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleSelectMiniSite = (miniSite: MiniSite) => {
    setSelectedMiniSite(miniSite);
    setShowConfirmDialog(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={disabled || !targetUserId}>
            <Download className="w-4 h-4 mr-2" />
            Importer mini-site
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Importer un mini-site existant</DialogTitle>
            {targetUserName && (
              <p className="text-sm text-muted-foreground">
                Import vers le mini-site de <strong>{targetUserName}</strong>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Rechercher un mini-site</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nom, profession, ville, utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p>Chargement des mini-sites...</p>
                </div>
              ) : filteredMiniSites?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Aucun mini-site trouvé pour cette recherche' : 'Aucun mini-site disponible'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMiniSites?.map((miniSite) => (
                    <Card 
                      key={miniSite.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectMiniSite(miniSite)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src="" />
                              <AvatarFallback>
                                <User className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{miniSite.site_name}</CardTitle>
                              <CardDescription>
                                {miniSite.first_name} {miniSite.last_name} • {miniSite.profession}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {miniSite.is_published && (
                              <Badge variant="secondary">
                                <Globe className="w-3 h-3 mr-1" />
                                Publié
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{miniSite.city}</span>
                          <span>Par {miniSite.display_name || miniSite.email}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'import</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Êtes-vous sûr de vouloir importer le mini-site{' '}
                  <strong>"{selectedMiniSite?.site_name}"</strong> de{' '}
                  <strong>{selectedMiniSite?.first_name} {selectedMiniSite?.last_name}</strong>{' '}
                  vers le mini-site de <strong>{targetUserName}</strong> ?
                </p>
                <p className="text-destructive font-medium">
                  ⚠️ Cette action remplacera toutes les données existantes du mini-site de destination 
                  (informations personnelles, carrousel, liens sociaux, etc.).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={importing}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleImport}
              disabled={importing}
              className="bg-destructive hover:bg-destructive/90"
            >
              {importing ? 'Import en cours...' : 'Confirmer l\'import'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};