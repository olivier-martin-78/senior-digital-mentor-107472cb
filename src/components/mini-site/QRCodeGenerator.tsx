import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  url: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple QR Code generator using QR.js or similar approach
  // For now, we'll use a placeholder and suggest using a library
  useEffect(() => {
    generateQRCode();
  }, [url]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !url) return;

    const canvas = canvasRef.current;
    
    try {
      await QRCode.toCanvas(canvas, url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération du QR Code:', error);
    }
  };

  const downloadQRCode = () => {
    if (!canvasRef.current) return;

    try {
      const link = document.createElement('a');
      link.download = 'qr-code-mini-site.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
      
      toast({
        title: "Succès",
        description: "QR Code téléchargé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du QR Code",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      <Label>QR Code d'accès au mini-site</Label>
      <div className="flex items-start gap-4">
        <div className="border rounded-lg p-2">
          <canvas 
            ref={canvasRef}
            className="border"
            style={{ maxWidth: '150px', maxHeight: '150px' }}
          />
        </div>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Scannez ce QR Code pour accéder directement à votre mini-site
          </div>
          <Button onClick={downloadQRCode} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Télécharger le QR Code
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        URL: {url}
      </div>
    </div>
  );
};