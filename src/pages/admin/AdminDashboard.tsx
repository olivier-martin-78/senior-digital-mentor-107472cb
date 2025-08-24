import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, Activity, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserActions, useUsageStats } from '@/hooks/useUserActions';
import UserSelector from '@/components/UserSelector';
import { UserActionsService } from '@/services/UserActionsService';
import { toast } from 'sonner';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2025-06-01'));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [contentType, setContentType] = useState<string>('all');
  const [actionType, setActionType] = useState<string>('all');
  const [selectedContentTitle, setSelectedContentTitle] = useState<string | null>(null);

  // Rediriger si pas admin
  if (!hasRole('admin')) {
    navigate('/unauthorized');
    return null;
  }

  const filters = {
    userId: selectedUserId || undefined,
    startDate: startDate ? format(startOfDay(startDate), 'yyyy-MM-dd HH:mm:ss') : undefined,
    endDate: endDate ? format(endOfDay(endDate), 'yyyy-MM-dd HH:mm:ss') : undefined,
    contentType: contentType === 'all' ? undefined : contentType as any,
    actionType: actionType === 'all' ? undefined : actionType as any,
    contentTitle: selectedContentTitle || undefined,
  };

  const {
    actions,
    totalCount,
    currentPage,
    totalPages,
    isLoading: actionsLoading,
    refetch,
    setPage
  } = useUserActions(filters);

  const {
    data: stats,
    isLoading: statsLoading
  } = useUsageStats(filters);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'view': return <Eye className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'view': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'create': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'update': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'delete': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'activity': return 'Activité';
      case 'blog_post': return 'Article';
      case 'diary_entry': return 'Journal';
      case 'wish_post': return 'Souhait';
      case 'life_story': return 'Récit de vie';
      default: return contentType;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'view': return 'Consultation';
      case 'create': return 'Création';
      case 'update': return 'Modification';
      case 'delete': return 'Suppression';
      default: return actionType;
    }
  };

  const handleDeleteUserActions = async () => {
    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur');
      return;
    }

    const confirmDelete = window.confirm(
      'Êtes-vous sûr de vouloir supprimer TOUTES les actions de cet utilisateur ? Cette action est irréversible.'
    );

    if (!confirmDelete) return;

    try {
      const result = await UserActionsService.deleteAllUserActions(selectedUserId);
      
      if (result.success) {
        toast.success(`${result.deletedCount} actions supprimées avec succès`);
        refetch(); // Recharger les données
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression des actions');
      console.error('Delete error:', error);
    }
  };

  const handleContentClick = (contentTitle: string) => {
    if (selectedContentTitle === contentTitle) {
      // Désélectionner si déjà sélectionné
      setSelectedContentTitle(null);
    } else {
      // Sélectionner le nouveau contenu
      setSelectedContentTitle(contentTitle);
    }
  };

  const handleUserSessionClick = (userId: string) => {
    if (selectedUserId === userId) {
      // Désélectionner si déjà sélectionné
      setSelectedUserId(null);
    } else {
      // Sélectionner le nouvel utilisateur
      setSelectedUserId(userId);
    }
  };

  const clearAllFilters = () => {
    setSelectedUserId(null);
    setContentType('all');
    setActionType('all');
    setSelectedContentTitle(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tableau de bord administrateur</h1>
              <p className="text-muted-foreground">
                Suivi des actions et utilisation de CaprIA
              </p>
            </div>
          </div>
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>

        {/* Statistiques globales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions totales</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.totalActionsGlobal.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur la période sélectionnée
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.uniqueUsers.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs uniques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contenu populaire</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : stats?.topContent.length || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Contenus consultés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions récentes</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {actionsLoading ? '...' : totalCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Dans les filtres actuels
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>
              Filtrez les actions par utilisateur, période et type de contenu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Sélecteur d'utilisateur */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Utilisateur</label>
                <UserSelector
                  permissionType="blog"
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                  adminMode={true}
                />
              </div>

              {/* Date de début */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de début</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date de fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Sélectionner"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Type de contenu */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de contenu</label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="activity">Activités</SelectItem>
                    <SelectItem value="blog_post">Articles de blog</SelectItem>
                    <SelectItem value="diary_entry">Entrées de journal</SelectItem>
                    <SelectItem value="wish_post">Souhaits</SelectItem>
                    <SelectItem value="life_story">Récits de vie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type d'action */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type d'action</label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les actions</SelectItem>
                    <SelectItem value="view">Consultations</SelectItem>
                    <SelectItem value="create">Créations</SelectItem>
                    <SelectItem value="update">Modifications</SelectItem>
                    <SelectItem value="delete">Suppressions</SelectItem>
                  </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filtre de contenu actif et bouton de réinitialisation */}
              {(selectedUserId || contentType !== 'all' || actionType !== 'all' || selectedContentTitle) && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {selectedContentTitle && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Contenu : {selectedContentTitle}
                        <button
                          onClick={() => setSelectedContentTitle(null)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedUserId && (
                      <Badge variant="secondary">
                        Utilisateur sélectionné
                        <button
                          onClick={() => setSelectedUserId(null)}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {contentType !== 'all' && (
                      <Badge variant="secondary">
                        Type : {getContentTypeLabel(contentType)}
                        <button
                          onClick={() => setContentType('all')}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {actionType !== 'all' && (
                      <Badge variant="secondary">
                        Action : {getActionLabel(actionType)}
                        <button
                          onClick={() => setActionType('all')}
                          className="ml-2 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={clearAllFilters}>
                    Réinitialiser tous les filtres
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Actions administratives */}
        {selectedUserId && (
          <Card>
            <CardHeader>
              <CardTitle>Actions administratives</CardTitle>
              <CardDescription>
                Actions disponibles pour l'utilisateur sélectionné
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={handleDeleteUserActions}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer toutes les actions de cet utilisateur
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Contenu le plus consulté */}
        {stats?.topContent && stats.topContent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contenu le plus consulté</CardTitle>
              <CardDescription>
                Les contenus les plus populaires sur la période
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topContent.slice(0, 10).map((content, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:bg-accent/50",
                      selectedContentTitle === content.content_title && "bg-primary/10 border-primary/50"
                    )}
                    onClick={() => handleContentClick(content.content_title)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer",
                        selectedContentTitle === content.content_title 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-primary/10"
                      )}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium hover:underline cursor-pointer">{content.content_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {getContentTypeLabel(content.content_type)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {content.view_count} vue{content.view_count > 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau des actions */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des actions</CardTitle>
            <CardDescription>
              {totalCount} action{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="text-center p-8">
                <p>Chargement des actions...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-muted-foreground">Aucune action trouvée avec ces filtres.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Type de contenu</TableHead>
                      <TableHead>Titre du contenu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions
                      .reduce((deduplicatedActions, action, index) => {
                        // Grouper les actions consécutives similaires
                        if (index === 0) {
                          deduplicatedActions.push({
                            ...action,
                            count: 1,
                            isGroup: false
                          });
                        } else {
                          const lastAction = deduplicatedActions[deduplicatedActions.length - 1];
                          const timeDiff = new Date(action.timestamp).getTime() - new Date(lastAction.timestamp).getTime();
                          const isSimilar = action.user_id === lastAction.user_id && 
                                           action.action_type === lastAction.action_type && 
                                           action.content_title === lastAction.content_title &&
                                           timeDiff < 300000; // 5 minutes
                          
                          if (isSimilar && lastAction.count < 5) {
                            // Grouper avec l'action précédente
                            lastAction.count++;
                            lastAction.isGroup = true;
                          } else {
                            // Nouvelle action
                            deduplicatedActions.push({
                              ...action,
                              count: 1,
                              isGroup: false
                            });
                          }
                        }
                        return deduplicatedActions;
                      }, [] as any[])
                      .map((action) => (
                      <TableRow key={`${action.id}-${action.count}`}>
                        <TableCell className="text-sm">
                          {format(new Date(action.timestamp), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {action.profiles?.display_name || 'Utilisateur inconnu'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {action.profiles?.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("flex items-center space-x-1", getActionColor(action.action_type))}
                          >
                            {getActionIcon(action.action_type)}
                            <span>{getActionLabel(action.action_type)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getContentTypeLabel(action.content_type)}
                          </Badge>
                        </TableCell>
                         <TableCell className="max-w-xs truncate">
                           {action.content_title}
                           {action.isGroup && action.count > 1 && (
                             <span className="ml-2 text-xs text-muted-foreground">
                               ({action.count} actions similaires)
                             </span>
                           )}
                         </TableCell>
                      </TableRow>
                     ))}
                  </TableBody>
                </Table>

                {/* Sessions par utilisateur */}
                {stats?.sessionsByUser && stats.sessionsByUser.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold mb-4">Sessions par utilisateur</h4>
                    <div className="grid gap-2 max-h-80 overflow-y-auto">
                      {stats.sessionsByUser.map((userSession, index) => (
                        <div 
                          key={userSession.user_id} 
                          className={cn(
                            "flex items-center justify-between p-3 border rounded cursor-pointer transition-colors",
                            "hover:bg-accent/50",
                            selectedUserId === userSession.user_id 
                              ? "bg-primary/10 border-primary" 
                              : "bg-background"
                          )}
                          onClick={() => handleUserSessionClick(userSession.user_id)}
                        >
                          <span className="text-sm font-medium">
                            {userSession.display_name}
                          </span>
                          <Badge 
                            variant={selectedUserId === userSession.user_id ? "default" : "outline"}
                            className="cursor-pointer"
                          >
                            {userSession.session_count} session{userSession.session_count > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;