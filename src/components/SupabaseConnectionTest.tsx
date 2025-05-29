
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const SupabaseConnectionTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: any[] = [];

    // Test 1: Configuration basique
    results.push({
      test: 'Configuration Supabase',
      status: supabase.supabaseUrl && supabase.supabaseKey ? 'OK' : 'ERREUR',
      details: {
        url: supabase.supabaseUrl,
        keyPresent: !!supabase.supabaseKey
      }
    });

    // Test 2: Connectivité base de données
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      results.push({
        test: 'Connectivité base de données',
        status: error ? 'ERREUR' : 'OK',
        details: error ? error.message : 'Connexion réussie'
      });
    } catch (err: any) {
      results.push({
        test: 'Connectivité base de données',
        status: 'ERREUR',
        details: err.message
      });
    }

    // Test 3: Fonction edge avec OPTIONS
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-contact-email`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        }
      });
      results.push({
        test: 'Fonction edge (OPTIONS)',
        status: response.ok ? 'OK' : 'ERREUR',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      });
    } catch (err: any) {
      results.push({
        test: 'Fonction edge (OPTIONS)',
        status: 'ERREUR',
        details: err.message
      });
    }

    // Test 4: Fonction edge avec POST minimal
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Message de test'
        })
      });
      
      const responseText = await response.text();
      results.push({
        test: 'Fonction edge (POST)',
        status: response.ok ? 'OK' : 'ERREUR',
        details: {
          status: response.status,
          statusText: response.statusText,
          response: responseText.substring(0, 200)
        }
      });
    } catch (err: any) {
      results.push({
        test: 'Fonction edge (POST)',
        status: 'ERREUR',
        details: err.message
      });
    }

    // Test 5: Via client Supabase
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: 'Test',
          email: 'test@example.com',
          message: 'Message de test via client'
        }
      });
      
      results.push({
        test: 'Client Supabase invoke',
        status: error ? 'ERREUR' : 'OK',
        details: error ? error.message : data
      });
    } catch (err: any) {
      results.push({
        test: 'Client Supabase invoke',
        status: 'ERREUR',
        details: err.message
      });
    }

    setTestResults(results);
    setTesting(false);
    console.log('=== RÉSULTATS TESTS COMPLETS ===', results);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle>Test de connectivité Supabase</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={testing} className="mb-4">
          {testing ? 'Tests en cours...' : 'Lancer les tests'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{result.test}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
