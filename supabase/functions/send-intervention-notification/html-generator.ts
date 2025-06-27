
import { ReportData } from './types.ts';

// Fonction utilitaire pour vérifier si un array existe et n'est pas vide
const hasItems = (arr: any): boolean => arr && Array.isArray(arr) && arr.length > 0;

// Fonction utilitaire pour générer une liste HTML
const generateList = (items: any[], otherText?: string): string => {
  if (!hasItems(items)) return '';
  
  let listHtml = '<ul>';
  items.forEach(item => {
    listHtml += `<li>${item}</li>`;
  });
  listHtml += '</ul>';
  
  if (otherText) {
    listHtml += `<p><strong>Autres :</strong> ${otherText}</p>`;
  }
  
  return listHtml;
};

export const generatePDFContent = (
  report: ReportData, 
  clientName: string, 
  mediaFiles?: any[], 
  audioUrl?: string
): string => {
  const reportDate = new Date(report.date).toLocaleDateString('fr-FR');
  
  // Générer la section des médias publics si ils existent
  const mediaSection = mediaFiles && mediaFiles.length > 0 ? `
    <div class="section">
      <div class="section-title">📷 Photos et médias</div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
        ${mediaFiles.map(media => `
          <div style="text-align: center; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;">
            <img src="${media.url}" alt="Média du rapport" style="max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">${media.name || 'Image'}</p>
            <a href="${media.url}" target="_blank" style="font-size: 11px; color: #2563eb; text-decoration: none;">Ouvrir l'image</a>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Générer la section audio public si elle existe
  const audioSection = audioUrl ? `
    <div class="section">
      <div class="section-title">🎵 Enregistrement audio</div>
      <div style="background: #fef7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0 0 10px 0;">Un enregistrement audio est disponible pour ce rapport :</p>
        <a href="${audioUrl}" target="_blank" style="display: inline-block; background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          🎧 Écouter l'enregistrement
        </a>
      </div>
    </div>
  ` : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport d'intervention - ${clientName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .section-title { color: #2563eb; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .label { font-weight: bold; color: #374151; }
        .observations { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'intervention</h1>
        <p><strong>Patient :</strong> ${report.patient_name || 'Non spécifié'}</p>
        <p><strong>Date :</strong> ${reportDate}</p>
        <p><strong>Auxiliaire :</strong> ${report.auxiliary_name || 'Non spécifié'}</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Horaires :</div>
          ${report.start_time && report.end_time ? `${report.start_time} - ${report.end_time}` : 'Non spécifié'}
        </div>
        <div class="info-item">
          <div class="label">Tarif horaire :</div>
          ${report.hourly_rate ? `${report.hourly_rate}€/h` : 'Non spécifié'}
        </div>
      </div>

      ${hasItems(report.activities) ? `
      <div class="section">
        <div class="section-title">Activités réalisées</div>
        ${generateList(report.activities, report.activities_other)}
      </div>
      ` : ''}

      ${hasItems(report.physical_state) ? `
      <div class="section">
        <div class="section-title">État physique</div>
        ${generateList(report.physical_state, report.physical_state_other)}
        ${report.pain_location ? `<p><strong>Douleur :</strong> ${report.pain_location}</p>` : ''}
      </div>
      ` : ''}

      ${hasItems(report.mental_state) ? `
      <div class="section">
        <div class="section-title">État mental</div>
        ${generateList(report.mental_state)}
        ${report.mental_state_change ? `<p><strong>Changements :</strong> ${report.mental_state_change}</p>` : ''}
      </div>
      ` : ''}

      ${hasItems(report.hygiene) ? `
      <div class="section">
        <div class="section-title">Hygiène</div>
        ${generateList(report.hygiene)}
        ${report.hygiene_comments ? `<p><strong>Commentaires :</strong> ${report.hygiene_comments}</p>` : ''}
      </div>
      ` : ''}

      <div class="info-grid">
        ${report.appetite ? `
        <div class="info-item">
          <div class="label">Appétit :</div>
          ${report.appetite}
          ${report.appetite_comments ? `<br><em>${report.appetite_comments}</em>` : ''}
        </div>
        ` : ''}
        ${report.hydration ? `
        <div class="info-item">
          <div class="label">Hydratation :</div>
          ${report.hydration}
        </div>
        ` : ''}
      </div>

      ${hasItems(report.follow_up) ? `
      <div class="section">
        <div class="section-title">Suivi nécessaire</div>
        ${generateList(report.follow_up, report.follow_up_other)}
      </div>
      ` : ''}

      ${report.observations ? `
      <div class="observations">
        <div class="section-title">Observations générales</div>
        <p>${report.observations}</p>
      </div>
      ` : ''}

      ${mediaSection}

      ${audioSection}

      ${report.client_rating || report.client_comments ? `
      <div class="section">
        <div class="section-title">Évaluation du client</div>
        ${report.client_rating ? `<p><strong>Note :</strong> ${report.client_rating}/5 ⭐</p>` : ''}
        ${report.client_comments ? `<p><strong>Commentaires :</strong> ${report.client_comments}</p>` : ''}
      </div>
      ` : ''}
    </body>
    </html>
  `;
};
