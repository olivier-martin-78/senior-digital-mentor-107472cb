
import { RecentItem } from '@/hooks/useRecentItems';

export const getItemLink = (item: RecentItem) => {
  switch (item.type) {
    case 'blog':
      return `/blog/${item.id}`;
    case 'wish':
      return `/wishes/${item.id}`;
    case 'diary':
      return `/diary/${item.id}`;
    case 'comment':
      return `/blog/${item.id}`; // Lien vers le post commenté
    default:
      return '#';
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case 'blog':
      return 'Article';
    case 'wish':
      return 'Souhait';
    case 'diary':
      return 'Journal';
    case 'comment':
      return 'Commentaire';
    default:
      return type;
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'blog':
      return 'bg-blue-500';
    case 'wish':
      return 'bg-tranches-sage';
    case 'diary':
      return 'bg-purple-500';
    case 'comment':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};
