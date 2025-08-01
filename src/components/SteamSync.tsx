import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { SteamService } from '../services/steamService';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Download, ExternalLink } from 'lucide-react';

interface SteamSyncProps {
  onSyncComplete?: () => void;
}

export const SteamSync = ({ onSyncComplete }: SteamSyncProps) => {
  const [steamId, setSteamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSync = async () => {
    if (!steamId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu Steam ID",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Necesitas estar autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await SteamService.syncUserLibrary(user.id, steamId.trim());
      
      if (result.success) {
        toast({
          title: "¡Sincronización exitosa!",
          description: result.message,
        });
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        toast({
          title: "Error en sincronización",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      toast({
        title: "Error",
        description: "Error inesperado durante la sincronización",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Download className="w-6 h-6 text-blue-500" />
          Sincronizar Biblioteca de Steam
        </CardTitle>
        <CardDescription>
          Importa tu biblioteca de juegos desde Steam para comenzar a usar Steam Compass
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">¿Cómo encontrar tu Steam ID?</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Ve a tu perfil de Steam</li>
            <li>2. Copia la URL (ej: steamcommunity.com/id/tunombre)</li>
            <li>3. Pega la URL completa o solo tu nombre de usuario</li>
          </ol>
          <div className="mt-3">
            <a
              href="https://steamcommunity.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Ir a Steam Community
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="steamId">Steam ID o URL del Perfil</Label>
          <Input
            id="steamId"
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="tunombre o steamcommunity.com/id/tunombre"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Acepta: nombre de usuario, URL completa, o Steam ID64
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> Tu perfil de Steam debe ser público para poder importar tu biblioteca. 
            Puedes hacerlo privado después de la importación.
          </p>
        </div>

        <Button
          onClick={handleSync}
          disabled={isLoading || !steamId.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Sincronizar Biblioteca
            </>
          )}
        </Button>

        {!SteamService.isConfigured() && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Modo de desarrollo:</strong> Steam API no configurada. Se usarán datos de prueba.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
