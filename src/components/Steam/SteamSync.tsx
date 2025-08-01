import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SteamService } from '../../services/steamService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { Loader2, GamepadIcon, ExternalLink } from 'lucide-react';

interface SteamSyncProps {
  onSyncComplete?: () => void;
}

export const SteamSync = ({ onSyncComplete }: SteamSyncProps) => {
  const [steamInput, setSteamInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSync = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para sincronizar",
        variant: "destructive",
      });
      return;
    }

    if (!steamInput.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu Steam ID o URL de perfil",
        variant: "destructive",
      });
      return;
    }

    if (!SteamService.isConfigured()) {
      toast({
        title: "Configuración Pendiente",
        description: "La API de Steam no está configurada. Contacta al administrador.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Extraer Steam ID del input
      const steamId = SteamService.extractSteamId(steamInput.trim());
      
      if (!steamId) {
        toast({
          title: "Error",
          description: "Steam ID o URL de perfil inválido",
          variant: "destructive",
        });
        return;
      }

      // Sincronizar biblioteca
      const result = await SteamService.syncUserLibrary(user.id, steamId);

      if (result.success) {
        toast({
          title: "¡Sincronización Exitosa!",
          description: result.message,
        });
        
        // Limpiar input
        setSteamInput('');
        
        // Notificar al componente padre
        onSyncComplete?.();
      } else {
        toast({
          title: "Error en Sincronización",
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
        <div className="flex items-center justify-center gap-2 mb-2">
          <GamepadIcon className="w-8 h-8 text-blue-500" />
          <CardTitle className="text-2xl font-bold">Sincronizar con Steam</CardTitle>
        </div>
        <CardDescription>
          Importa tu biblioteca de juegos desde Steam para comenzar a usar Steam Compass
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Información sobre cómo obtener Steam ID */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">¿Cómo encontrar tu Steam ID?</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Copia la URL de tu perfil de Steam</p>
            <p>• O usa tu Steam ID de 17 dígitos</p>
            <p>• Ejemplo: <code className="bg-blue-100 px-1 rounded">steamcommunity.com/id/tunombre</code></p>
          </div>
          <a
            href="https://steamcommunity.com/my/profile"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Ver mi perfil de Steam <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Input para Steam ID */}
        <div className="space-y-2">
          <Label htmlFor="steamId">Steam ID o URL del Perfil</Label>
          <Input
            id="steamId"
            type="text"
            value={steamInput}
            onChange={(e) => setSteamInput(e.target.value)}
            placeholder="76561198000000000 o https://steamcommunity.com/id/tunombre"
            className="text-sm"
          />
        </div>

        {/* Botón de sincronización */}
        <Button
          onClick={handleSync}
          disabled={isLoading || !steamInput.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sincronizando biblioteca...
            </>
          ) : (
            <>
              <GamepadIcon className="w-4 h-4 mr-2" />
              Sincronizar Biblioteca
            </>
          )}
        </Button>

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Tu perfil de Steam debe ser público para poder importar los juegos</p>
          <p>• Este proceso puede tomar unos momentos dependiendo del tamaño de tu biblioteca</p>
          <p>• Solo se importarán los juegos, no la información personal</p>
        </div>
      </CardContent>
    </Card>
  );
};
