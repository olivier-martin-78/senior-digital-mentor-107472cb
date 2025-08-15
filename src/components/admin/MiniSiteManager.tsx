import React, { useState, useEffect } from 'react';
import { MiniSiteForm } from '@/components/mini-site/MiniSiteForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MiniSiteManagerProps {
  userId: string;
  userName: string;
}

export const MiniSiteManager: React.FC<MiniSiteManagerProps> = ({ userId, userName }) => {
  const [hasSavedMiniSite, setHasSavedMiniSite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMiniSiteExists = async () => {
      try {
        const { data, error } = await supabase
          .from('mini_sites')
          .select('id, updated_at, created_at')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erreur lors de la vérification du mini-site:', error);
        } else if (data) {
          // L'utilisateur a un mini-site et l'a modifié après création (a cliqué sur Enregistrer)
          setHasSavedMiniSite(data.updated_at !== data.created_at);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du mini-site:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMiniSiteExists();
  }, [userId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant={hasSavedMiniSite ? "default" : "outline"} 
          size="sm"
          className={hasSavedMiniSite ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
        >
          <Globe2 className="w-4 h-4 mr-2" />
          Mini-site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Gérer le mini-site de {userName}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <MiniSiteForm userId={userId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};