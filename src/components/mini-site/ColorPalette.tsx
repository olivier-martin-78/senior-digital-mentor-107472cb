import React from 'react';
import { Label } from '@/components/ui/label';

interface ColorPaletteProps {
  value: string;
  onChange: (palette: string) => void;
}

const colorPalettes = [
  {
    name: 'blue',
    label: 'Bleu Océan',
    colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
  },
  {
    name: 'green',
    label: 'Vert Nature',
    colors: ['#166534', '#16a34a', '#4ade80', '#86efac']
  },
  {
    name: 'purple',
    label: 'Violet Élégant',
    colors: ['#6b21a8', '#9333ea', '#a855f7', '#c084fc']
  },
  {
    name: 'pink',
    label: 'Rose Douceur',
    colors: ['#be185d', '#e91e63', '#f472b6', '#f8bbd9']
  },
  {
    name: 'orange',
    label: 'Orange Chaleur',
    colors: ['#ea580c', '#f97316', '#fb923c', '#fed7aa']
  },
  {
    name: 'teal',
    label: 'Sarcelle Moderne',
    colors: ['#0f766e', '#14b8a6', '#5eead4', '#99f6e4']
  },
  {
    name: 'red',
    label: 'Rouge Passion',
    colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5']
  },
  {
    name: 'indigo',
    label: 'Indigo Profond',
    colors: ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc']
  },
  {
    name: 'yellow',
    label: 'Jaune Soleil',
    colors: ['#ca8a04', '#eab308', '#facc15', '#fef08a']
  },
  {
    name: 'gray',
    label: 'Gris Sophistiqué',
    colors: ['#374151', '#6b7280', '#9ca3af', '#d1d5db']
  },
  {
    name: 'emerald',
    label: 'Émeraude Précieux',
    colors: ['#047857', '#10b981', '#34d399', '#6ee7b7']
  },
  {
    name: 'cyan',
    label: 'Cyan Fraîcheur',
    colors: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9']
  },
  {
    name: 'rose',
    label: 'Rose Romantique',
    colors: ['#be1558', '#e11d48', '#f43f5e', '#fb7185']
  },
  {
    name: 'amber',
    label: 'Ambre Doré',
    colors: ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d']
  },
  {
    name: 'slate',
    label: 'Ardoise Minérale',
    colors: ['#334155', '#64748b', '#94a3b8', '#cbd5e1']
  }
];

export const ColorPalette: React.FC<ColorPaletteProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <Label>Choisissez votre palette de couleurs</Label>
      <div className="grid grid-cols-3 gap-3">
        {colorPalettes.map((palette) => (
          <div
            key={palette.name}
            className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
              value === palette.name 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onChange(palette.name)}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex space-x-1">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="text-sm font-medium">{palette.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};