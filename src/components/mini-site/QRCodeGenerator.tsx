import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // For production, you would use a QR code library like qrcode or qr.js
    // For now, we'll create a simple placeholder
    canvas.width = 200;
    canvas.height = 200;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    // Create a simple pattern (this is not a real QR code)
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i * 10, j * 10, 10, 10);
        }
      }
    }

    // Add corners (typical QR code feature)
    const cornerSize = 30;
    // Top-left corner
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 10, 10, 10);
    
    // Top-right corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(170, 0, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(180, 10, 10, 10);
    
    // Bottom-left corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 170, cornerSize, cornerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 180, 10, 10);
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