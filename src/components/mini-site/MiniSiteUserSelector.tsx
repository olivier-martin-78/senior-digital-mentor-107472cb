import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
}

interface MiniSiteUserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  className?: string;
}

export const MiniSiteUserSelector: React.FC<MiniSiteUserSelectorProps> = ({
  selectedUserId,
  onUserChange,
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-for-mini-site'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .order('display_name');

      if (error) throw error;
      return data as UserProfile[];
    }
  });

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  const selectedUser = users.find(user => user.id === selectedUserId);

  const handleClearSelection = () => {
    onUserChange(null);
  };

  const getDisplayText = () => {
    if (!selectedUserId) return 'Mon mini-site';
    if (selectedUser) {
      return `Mini-site de ${selectedUser.display_name || selectedUser.email}`;
    }
    return 'Utilisateur sélectionné';
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Créer/modifier pour :</span>
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between"
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : getDisplayText()}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="my-mini-site"
                    onSelect={() => {
                      onUserChange(null);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUserId === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Mon mini-site
                  </CommandItem>
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`user-${user.id}`}
                      onSelect={() => {
                        onUserChange(user.id === selectedUserId ? null : user.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedUserId === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{user.display_name || user.email}</span>
                        {user.display_name && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedUserId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            className="p-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedUserId && (
        <p className="text-xs text-muted-foreground">
          Vous modifiez le mini-site d'un autre utilisateur
        </p>
      )}
    </div>
  );
};