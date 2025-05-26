
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onClear 
}: DateRangeFilterProps) => {
  return (
    <div className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <Label htmlFor="startDate" className="text-sm font-medium">
          Date de début
        </Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="mt-1"
        />
      </div>
      <div className="flex-1">
        <Label htmlFor="endDate" className="text-sm font-medium">
          Date de fin
        </Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="mt-1"
        />
      </div>
      {(startDate || endDate) && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          className="h-10 w-10"
          title="Effacer les filtres"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DateRangeFilter;
