import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AudioUploadForm } from '@/components/admin/audio-memory/AudioUploadForm';
import { AudioSoundsTable } from '@/components/admin/audio-memory/AudioSoundsTable';
import { Upload, Database } from 'lucide-react';

export const AdminAudioMemorySounds: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Gestion des Sons - Mémoire Auditive</h1>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Uploader des sons
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Gérer les sons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload de nouveaux sons MP3</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioUploadForm onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Sons existants</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioSoundsTable key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};