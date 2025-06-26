
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { InterventionFormData } from '../types/FormData';

interface BasicInfoSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  setFormData
}) => {
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      date: date ? date.toISOString().split('T')[0] : ''
    }));
  };

  const selectedDate = formData.date ? new Date(formData.date) : undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Informations de base</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patient_name">Nom du patient *</Label>
          <Input
            id="patient_name"
            value={formData.patient_name}
            onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="auxiliary_name">Nom de l'auxiliaire *</Label>
          <Input
            id="auxiliary_name"
            value={formData.auxiliary_name}
            onChange={(e) => setFormData(prev => ({ ...prev, auxiliary_name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label>Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Sélectionner une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="start_time">Heure de début *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_time">Heure de fin *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="hourly_rate">Taux horaire (€)</Label>
          <Input
            id="hourly_rate"
            type="number"
            step="0.01"
            value={formData.hourly_rate}
            onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
};
