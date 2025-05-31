
import { DiaryEntryWithAuthor } from '@/types/diary';

export const filterEntriesBySearchTerm = (
  entries: any[],
  searchTerm: string,
  allProfiles: any[]
): DiaryEntryWithAuthor[] => {
  if (!searchTerm) return convertEntriesToWithAuthor(entries, allProfiles);
  
  console.log('🔍 Diary - Filtrage côté client avec terme:', searchTerm);
  
  return entries.filter(entry => {
    const searchLower = searchTerm.toLowerCase();
    
    // Recherche dans les champs texte (insensible à la casse)
    const textFields = [
      entry.title,
      entry.activities,
      entry.reflections,
      entry.positive_things,
      entry.negative_things,
      entry.desire_of_day,
      entry.objectives,
      entry.private_notes,
      entry.physical_state,
      entry.mental_state
    ];
    
    const textMatch = textFields.some(field => 
      field && field.toLowerCase().includes(searchLower)
    );
    
    // Recherche dans les arrays
    const tagsMatch = entry.tags?.some(tag => 
      tag && tag.toLowerCase().includes(searchLower)
    ) || false;
    
    const peopleMatch = entry.contacted_people?.some(person => 
      person && person.toLowerCase().includes(searchLower)
    ) || false;
    
    return textMatch || tagsMatch || peopleMatch;
  }).map(entry => convertEntryToWithAuthor(entry, allProfiles));
};

export const convertEntriesToWithAuthor = (
  entries: any[],
  allProfiles: any[]
): DiaryEntryWithAuthor[] => {
  return entries.map(entry => convertEntryToWithAuthor(entry, allProfiles));
};

export const convertEntryToWithAuthor = (
  entry: any,
  allProfiles: any[]
): DiaryEntryWithAuthor => {
  return {
    ...entry,
    physical_state: ['fatigué', 'dormi', 'énergique'].includes(entry.physical_state) 
      ? entry.physical_state as "fatigué" | "dormi" | "énergique" 
      : null,
    mental_state: ['stressé', 'calme', 'motivé'].includes(entry.mental_state)
      ? entry.mental_state as "stressé" | "calme" | "motivé"
      : null,
    desire_of_day: entry.desire_of_day || '',
    objectives: entry.objectives || '',
    positive_things: entry.positive_things || '',
    negative_things: entry.negative_things || '',
    reflections: entry.reflections || '',
    private_notes: entry.private_notes || '',
    contacted_people: entry.contacted_people || [],
    tags: entry.tags || [],
    profiles: allProfiles?.find(profile => profile.id === entry.user_id) || {
      id: entry.user_id,
      email: 'Utilisateur inconnu',
      display_name: null,
      avatar_url: null,
      created_at: new Date().toISOString()
    }
  };
};
