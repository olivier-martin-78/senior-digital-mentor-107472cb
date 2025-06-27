
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Clock, Copy } from 'lucide-react';
import { useLastReports } from '../hooks/useLastReports';
import { InterventionFormData } from '../types/FormData';
import { toast } from '@/hooks/use-toast';

interface LastReportsSelectorProps {
  clientName: string;
  onReportSelected: (reportData: Partial<InterventionFormData>) => void;
}

const LastReportsSelector: React.FC<LastReportsSelectorProps> = ({
  clientName,
  onReportSelected,
}) => {
  const { lastReports, loading, loadFullReport } = useLastReports(clientName);

  const handleReportSelection = async (reportId: string) => {
    if (reportId === 'none') return;

    const reportData = await loadFullReport(reportId);
    if (!reportData) return;

    onReportSelected(reportData);
    
    toast({
      title: 'Rapport copié',
      description: 'Les données du rapport précédent ont été copiées dans le formulaire',
    });
  };

  if (!clientName || lastReports.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <Label htmlFor="lastReport" className="flex items-center gap-2 text-sm font-medium text-blue-800">
        <Copy className="w-4 h-4" />
        Copier depuis un rapport précédent
      </Label>
      <Select onValueChange={handleReportSelection}>
        <SelectTrigger className="bg-white border-blue-300">
          <SelectValue placeholder="Sélectionner un rapport précédent..." />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
          <SelectItem value="none">Aucun rapport sélectionné</SelectItem>
          {lastReports.map((report) => (
            <SelectItem key={report.id} value={report.id}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>
                  {new Date(report.date).toLocaleDateString('fr-FR')} - {report.start_time} à {report.end_time}
                </span>
                <span className="text-gray-500 text-sm">({report.auxiliary_name})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && (
        <p className="text-sm text-blue-600">Chargement des rapports précédents...</p>
      )}
    </div>
  );
};

export default LastReportsSelector;
