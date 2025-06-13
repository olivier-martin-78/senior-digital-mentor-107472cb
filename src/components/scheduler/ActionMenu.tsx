
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppointmentExporter from './AppointmentExporter';
import InvoiceGenerator from './InvoiceGenerator';

interface ActionMenuProps {
  professionalId: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ professionalId }) => {
  const navigate = useNavigate();

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
        <DropdownMenuItem 
          onClick={() => navigate('/intervention-report')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Nouvelle intervention
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionMenu;
