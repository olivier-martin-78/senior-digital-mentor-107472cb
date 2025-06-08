
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays } from 'lucide-react';

interface RecurringAppointmentFormProps {
  isRecurring: boolean;
  onRecurringChange: (isRecurring: boolean) => void;
  endDate: string;
  onEndDateChange: (endDate: string) => void;
}

const RecurringAppointmentForm: React.FC<RecurringAppointmentFormProps> = ({
  isRecurring,
  onRecurringChange,
  endDate,
  onEndDateChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Récurrence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_recurring"
            checked={isRecurring}
            onCheckedChange={onRecurringChange}
          />
          <Label htmlFor="is_recurring">
            Rendez-vous récurrent hebdomadaire
          </Label>
        </div>

        {isRecurring && (
          <div>
            <Label htmlFor="recurrence_end_date">Date de fin de récurrence</Label>
            <Input
              id="recurrence_end_date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              required={isRecurring}
            />
            <p className="text-sm text-gray-600 mt-1">
              Les rendez-vous seront créés chaque semaine jusqu'à cette date
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringAppointmentForm;
