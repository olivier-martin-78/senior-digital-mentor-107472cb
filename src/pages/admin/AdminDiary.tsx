import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DiaryEntry, DiaryEntryWithAuthor } from '@/types/diary';

const AdminDiary = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    loadUsers();
    loadEntries();
  }, [hasRole, navigate]);

  useEffect(() => {
    loadEntries();
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .order('display_name');

      if (error) throw error;
      console.log('Utilisateurs chargés:', data?.length || 0);
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('diary_entries')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer par utilisateur sélectionné si défini
      if (selectedUserId) {
        console.log('Filtrage par utilisateur:', selectedUserId);
        query = query.eq('user_id', selectedUserId);
      }

      const { data: entriesData, error } = await query;

      if (error) {
        console.error('Erreur lors du chargement des entrées:', error);
        throw error;
      }

      // Récupérer les profils des utilisateurs séparément
      if (entriesData && entriesData.length > 0) {
        const userIds = [...new Set(entriesData.map(entry => entry.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, email, avatar_url, created_at, receive_contacts')
          .in('id', userIds);

        if (profilesError) {
          console.error('Erreur lors du chargement des profils:', profilesError);
          throw profilesError;
        }

        // Associer les profils aux entrées
        const entriesWithProfiles: DiaryEntryWithAuthor[] = entriesData.map(entry => ({
          ...entry,
          profiles: profilesData?.find(profile => profile.id === entry.user_id) || {
            id: entry.user_id,
            email: 'Utilisateur inconnu',
            display_name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            receive_contacts: false
          }
        }));

        console.log('Entrées de journal chargées:', entriesWithProfiles.length);
        setEntries(entriesWithProfiles);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entrées de journal:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (value: string) => {
    console.log('Changement d\'utilisateur sélectionné:', value);
    setSelectedUserId(value === 'all' ? '' : value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Administration - Journaux</h1>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <Select value={selectedUserId || 'all'} onValueChange={handleUserChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Tous les utilisateurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedUserId && (
            <Badge variant="secondary">
              {users.find(u => u.id === selectedUserId)?.display_name || 
               users.find(u => u.id === selectedUserId)?.email || 
               'Utilisateur sélectionné'}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {selectedUserId 
                  ? "Aucune entrée de journal trouvée pour cet utilisateur." 
                  : "Aucune entrée de journal trouvée."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-medium text-tranches-charcoal">
                      {entry.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/diary/${entry.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(entry.created_at)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Auteur:</strong> {entry.profiles?.display_name || entry.profiles?.email || 'Utilisateur inconnu'}
                    </div>
                    {entry.mood_rating && (
                      <div className="flex items-center">
                        <span className="text-sm mr-2">Humeur:</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span 
                              key={i} 
                              className={`w-4 h-4 rounded-full mx-0.5 ${i < entry.mood_rating! ? 'bg-yellow-400' : 'bg-gray-200'}`}
                            ></span>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDiary;
