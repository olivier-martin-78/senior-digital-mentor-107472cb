
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useCaregiversData } from '@/hooks/useCaregiversData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, FileText, Eye } from 'lucide-react';

const InterventionReportsList = () => {
  const { interventionReports, isLoading } = useCaregiversData();
  const navigate = useNavigate();

  const handleViewReport = (reportId: string) => {
    navigate(`/intervention-report?report_id=${reportId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (interventionReports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun rapport d'intervention disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {interventionReports.map((report) => (
        <Card key={report.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{report.patient_name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {format(new Date(report.date), 'dd MMMM yyyy', { locale: fr })}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewReport(report.id)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Voir le rapport
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(report.date), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{report.start_time} - {report.end_time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{report.auxiliary_name}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {report.client_rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Évaluation:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= report.client_rating!
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {report.client_comments && (
                  <div>
                    <span className="text-sm font-medium">Commentaire:</span>
                    <p className="text-sm text-gray-600 mt-1">{report.client_comments}</p>
                  </div>
                )}
              </div>
            </div>
            
            {report.observations && (
              <div className="mt-4 pt-4 border-t">
                <span className="text-sm font-medium">Observations:</span>
                <p className="text-sm text-gray-600 mt-1">{report.observations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InterventionReportsList;
