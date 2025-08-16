import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Globe, User } from 'lucide-react';
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
  const [selectedMiniSiteId, setSelectedMiniSiteId] = useState<string>('');
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
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) throw error;

      return data?.map(site => ({
        ...site,
        display_name: (site.profiles as any)?.display_name || '',
        email: (site.profiles as any)?.email || ''
      })) || [];
    },
    enabled: isOpen
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

  const handleSelectMiniSite = (miniSiteId: string) => {
    const miniSite = miniSites?.find(site => site.id === miniSiteId);
    if (miniSite) {
      setSelectedMiniSiteId(miniSiteId);
      setSelectedMiniSite(miniSite);
    }
  };

  const handleConfirmImport = () => {
    if (selectedMiniSite) {
      setShowConfirmDialog(true);
    }
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer un mini-site existant</DialogTitle>
            {targetUserName && (
              <p className="text-sm text-muted-foreground">
                Import vers le mini-site de <strong>{targetUserName}</strong>
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Sélectionner un mini-site à importer</Label>
              <Select 
                value={selectedMiniSiteId} 
                onValueChange={handleSelectMiniSite}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoading ? "Chargement..." : "Choisir un mini-site"} />
                </SelectTrigger>
                <SelectContent>
                  {miniSites?.map((miniSite) => (
                    <SelectItem key={miniSite.id} value={miniSite.id}>
                      {miniSite.first_name} {miniSite.last_name} - {miniSite.site_name} ({miniSite.city})
                    </SelectItem>  
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMiniSite && (
              <Card>
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
                        <CardTitle className="text-lg">{selectedMiniSite.site_name}</CardTitle>
                        <CardDescription>
                          {selectedMiniSite.first_name} {selectedMiniSite.last_name} • {selectedMiniSite.profession}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedMiniSite.is_published && (
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
                    <span>{selectedMiniSite.city}</span>
                    <span>Par {selectedMiniSite.display_name || selectedMiniSite.email}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedMiniSite && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleConfirmImport}>
                  Importer ce mini-site
                </Button>
              </div>
            )}
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