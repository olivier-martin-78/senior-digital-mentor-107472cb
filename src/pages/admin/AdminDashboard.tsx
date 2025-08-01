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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [contentType, setContentType] = useState<string>('all');
  const [actionType, setActionType] = useState<string>('all');

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
  };

  const {
    actions,
    totalCount,
    currentPage,
    totalPages,
    isLoading: actionsLoading,
    setPage
  } = useUserActions(filters);

  const {
    data: stats,
    isLoading: statsLoading
  } = useUsageStats({
    startDate: startDate ? format(startOfDay(startDate), 'yyyy-MM-dd HH:mm:ss') : undefined,
    endDate: endDate ? format(endOfDay(endDate), 'yyyy-MM-dd HH:mm:ss') : undefined,
  });

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
                {statsLoading ? '...' : stats?.totalActions.toLocaleString() || '0'}
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
          </CardContent>
        </Card>

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
                {stats.topContent.slice(0, 5).map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{content.content_title}</p>
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
                    {actions.map((action) => (
                      <TableRow key={action.id}>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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