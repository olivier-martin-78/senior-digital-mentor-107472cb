
import { ReportData } from './types.ts';

export const generateEmailHTML = (
  report: ReportData,
  clientName: string,
  caregiverName: string,
  mediaFiles?: any[],
  audioUrl?: string
): string => {
  const reportDate = new Date(report.date).toLocaleDateString('fr-FR');
  
  // Générer la section des médias si ils existent
  const mediaSection = mediaFiles && mediaFiles.length > 0 ? `
    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0c4a6e;">📷 Photos et médias</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
        ${mediaFiles.map(media => `
          <div style="text-align: center;">
            <img src="${media.url}" alt="Média du rapport" style="max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #e0e7ff;">
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${media.name || 'Image'}</p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Générer la section audio si elle existe
  const audioSection = audioUrl ? `
    <div style="background-color: #fef7ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #c2410c;">🎵 Enregistrement audio</h3>
      <p style="margin-bottom: 15px;">Un enregistrement audio a été ajouté à ce rapport :</p>
      <a href="${audioUrl}" 
         style="display: inline-block; background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        🎧 Écouter l'enregistrement
      </a>
    </div>
  ` : '';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nouveau rapport d'intervention</h2>
      
      <p>Bonjour ${caregiverName},</p>
      
      <p>Un nouveau rapport d'intervention a été créé pour <strong>${clientName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Détails du rapport</h3>
        <p><strong>Date :</strong> ${reportDate}</p>
        <p><strong>Patient :</strong> ${report.patient_name || 'Non spécifié'}</p>
        <p><strong>Auxiliaire :</strong> ${report.auxiliary_name || 'Non spécifié'}</p>
        ${report.start_time && report.end_time ? `<p><strong>Horaires :</strong> ${report.start_time} - ${report.end_time}</p>` : ''}
      </div>
      
      ${report.observations ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">Observations</h4>
          <p style="margin-bottom: 0;">${report.observations}</p>
        </div>
      ` : ''}
      
      ${mediaSection}
      
      ${audioSection}
      
      <p>Vous recevez ce message en tant que proche aidant de ${clientName}.</p>
      
      <p>Cordialement,<br>L'équipe Senior Digital Mentor</p>
    </div>
  `;
};
