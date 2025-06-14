
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';
import AppointmentExporter from './AppointmentExporter';
import InvoiceGenerator from './InvoiceGenerator';

interface ActionMenuProps {
  professionalId: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ professionalId }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white z-50">
        <DropdownMenuItem asChild>
          <div className="w-full">
            <AppointmentExporter professionalId={professionalId} />
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <div className="w-full">
            <InvoiceGenerator professionalId={professionalId} />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionMenu;
