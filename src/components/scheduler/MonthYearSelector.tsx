
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MonthYearSelectorProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export const MonthYearSelector: React.FC<MonthYearSelectorProps> = ({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}) => {
  // Générer les options de mois
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), 'MMMM', { locale: fr })
  }));

  // Générer les options d'années (5 ans dans le passé, année courante, 2 ans dans le futur)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">Mois</label>
        <Select value={selectedMonth.toString()} onValueChange={(value) => onMonthChange(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un mois" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium mb-2">Année</label>
        <Select value={selectedYear.toString()} onValueChange={(value) => onYearChange(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une année" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
