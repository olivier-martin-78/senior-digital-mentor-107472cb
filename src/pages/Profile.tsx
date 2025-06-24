import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Settings, Shield, Mail, Calendar, Crown, Edit2, Check, X, Camera } from 'lucide-react';
import { useDisplayNameValidation } from '@/hooks/useDisplayNameValidation';

const Profile = () => {
  const { session, user, isLoading, hasRole, profile } = useAuth();
  const navigate = useNavigate();
  const { checkDisplayNameUniqueness, isChecking } = useDisplayNameValidation();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!session && !isLoading) {
      navigate('/auth');
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        // Mettre à jour l'URL de l'avatar dans le profil
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        setAvatarUrl(data.publicUrl);
        toast({
          title: "Photo de profil mise à jour",
          description: "Votre photo de profil a été mise à jour avec succès.",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'upload de l'avatar:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la photo de profil: " + error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Vérifier l'unicité du nom public si il a changé
      if (displayName !== profile?.display_name) {
        const isUnique = await checkDisplayNameUniqueness(displayName);
        if (!isUnique) {
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (error) {
        throw error;
      }

      // Mettre à jour le nom public dans la table profiles
      if (displayName !== profile?.display_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: displayName || null })
          .eq('id', user?.id);

        if (profileError) {
          throw profileError;
        }
      }

      // Mettre à jour l'email localement
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email });
        if (emailError) {
          throw emailError;
        }
      }

      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été mis à jour avec succès.",
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le mot de passe: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = () => {
    if (hasRole('admin')) return 'Administrateur';
    if (hasRole('professionnel')) return 'Professionnel';
    if (hasRole('editor')) return 'Éditeur';
    if (hasRole('reader')) return 'Lecteur';
    return 'Utilisateur';
  };

  // Fonction pour obtenir la couleur du badge selon le rôle
  const getRoleBadgeVariant = () => {
    if (hasRole('admin')) return 'destructive';
    if (hasRole('professionnel')) return 'default';
    if (hasRole('editor')) return 'secondary';
    return 'outline';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-medium flex items-center gap-2">
              <User className="w-5 h-5" />
              Mon Profil
            </CardTitle>
            <Button variant="ghost" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Informations personnelles</h2>
                <p className="text-muted-foreground">
                  Gérez vos informations personnelles et votre adresse e-mail.
                </p>
              </div>
              <Separator />
              
              {/* Photo de profil */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl} alt="Photo de profil" />
                  <AvatarFallback className="text-lg">
                    {firstName?.charAt(0)}{lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="avatar">Photo de profil</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="w-auto"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('avatar')?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploadingAvatar ? 'Upload...' : 'Modifier photo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="displayName">Nom public</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing || isChecking}
                  placeholder="Nom affiché publiquement (optionnel)"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ce nom sera visible par les autres utilisateurs
                </p>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={getRoleBadgeVariant()}>
                    {getRoleLabel()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Votre rôle détermine vos permissions dans l'application
                </p>
              </div>
              {isEditing && (
                <Button onClick={handleUpdateProfile} disabled={loading || isChecking}>
                  {loading || isChecking ? (
                    <>
                      <div className="animate-spin mr-2 rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Mettre à jour le profil
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-medium flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Changer le mot de passe</h2>
                <p className="text-muted-foreground">
                  Modifiez votre mot de passe pour sécuriser votre compte.
                </p>
              </div>
              <Separator />
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Mettre à jour le mot de passe
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
