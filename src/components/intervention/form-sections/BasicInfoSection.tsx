
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BasicInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  setFormData,
  date,
  setDate
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="patientName">Nom du patient</Label>
          <Input
            type="text"
            id="patientName"
            value={formData.patientName}
            onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="auxiliaryName">Nom de l'auxiliaire</Label>
          <Input
            type="text"
            id="auxiliaryName"
            value={formData.auxiliaryName}
            onChange={(e) => setFormData({ ...formData, auxiliaryName: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={'outline'}
              className={cn(
                'w-[240px] justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              {date ? format(date, 'PPP') : <span>Choisir une date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              onDayClick={(date) => setFormData({ ...formData, date: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Heure de début</Label>
          <Input
            type="time"
            id="startTime"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="endTime">Heure de fin</Label>
          <Input
            type="time"
            id="endTime"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
        <Input
          type="number"
          id="hourlyRate"
          value={formData.hourlyRate || ''}
          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value ? parseFloat(e.target.value) : null })}
        />
      </div>
    </>
  );
};
