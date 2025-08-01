import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import { SteamService } from '../services/steamService';
import { useAuth } from '../hooks/useAuth';
import { 
  Loader2, 
  Download, 
  ExternalLink, 
  User, 
  Settings, 
  Eye, 
  CheckCircle,
  AlertCircle,
  Copy,
  Play
} from 'lucide-react';

interface SteamConnectionProps {
  onSyncComplete?: () => void;
}

export const SteamConnection = ({ onSyncComplete }: SteamConnectionProps) => {
  const [steamId, setSteamId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showInstructions, setShowInstructions] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const steps = [
    {
      id: 1,
      title: "Abre Steam Community",
      description: "Ve a Steam Community en tu navegador",
      icon: <Play className="w-5 h-5" />,
      action: "Ir a Steam Community",
      link: "https://steamcommunity.com/",
      detail: "Asegúrate de estar conectado con tu cuenta de Steam"
    },
    {
      id: 2,
      title: "Ve a tu perfil",
      description: "Haz clic en tu nombre de usuario y selecciona 'Ver perfil'",
      icon: <User className="w-5 h-5" />,
      tip: "También puedes ir directamente desde el menú desplegable de tu avatar",
      detail: "Si no ves 'Ver perfil', haz clic en tu avatar/nombre en la esquina superior derecha"
    },
    {
      id: 3,
      title: "Editar perfil",
      description: "En tu perfil, haz clic en 'Editar perfil'",
      icon: <Settings className="w-5 h-5" />,
      tip: "El botón está debajo de tu avatar y nombre",
      detail: "Si no ves este botón, asegúrate de estar en TU perfil, no en el de otra persona"
    },
    {
      id: 4,
      title: "Configuración de privacidad",
      description: "Ve a la pestaña 'Configuración de privacidad'",
      icon: <Eye className="w-5 h-5" />,
      important: "Esta es la parte más importante para que funcione la importación",
      detail: "Busca las pestañas en la parte superior: General, Configuración de privacidad, etc."
    },
    {
      id: 5,
      title: "Cambiar visibilidad del perfil",
      description: "Cambia 'Mi perfil' de 'Privado' a 'Público'",
      icon: <Eye className="w-5 h-5" />,
      important: "Tu perfil debe ser público para poder acceder a tu biblioteca",
      detail: "Busca la opción 'Mi perfil' y selecciona 'Público' en el dropdown"
    },
    {
      id: 6,
      title: "Hacer biblioteca pública",
      description: "Cambia 'Detalles del juego' a 'Público'",
      icon: <Eye className="w-5 h-5" />,
      critical: "¡CRUCIAL! Sin esto no podemos ver tus juegos",
      detail: "Esta opción permite que aplicaciones externas lean tu lista de juegos",
      note: "Puedes hacerlo privado después de importar tus juegos"
    },
    {
      id: 7,
      title: "Lista de deseados (opcional)",
      description: "Si quieres importar tu lista de deseados, haz 'Lista de deseados' público",
      icon: <Eye className="w-5 h-5" />,
      detail: "Esto es opcional, pero recomendado para una experiencia completa",
      tip: "La lista de deseados te ayuda a descubrir ofertas y nuevos juegos"
    },
    {
      id: 8,
      title: "Guardar cambios",
      description: "Haz clic en 'Guardar cambios' al final de la página",
      icon: <CheckCircle className="w-5 h-5" />,
      important: "¡No olvides guardar! Los cambios no se aplican automáticamente",
      detail: "Busca el botón verde 'Guardar cambios' al final de la página"
    },
    {
      id: 9,
      title: "Copia tu Steam ID",
      description: "Vuelve a tu perfil y copia la URL completa",
      icon: <Copy className="w-5 h-5" />,
      example: "steamcommunity.com/id/tunombre",
      detail: "Copia toda la URL desde la barra de direcciones del navegador",
      tip: "También puedes copiar solo tu nombre de usuario (la parte después de /id/)"
    }
  ];

  const handleSync = async () => {
    if (!steamId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu Steam ID o URL del perfil",
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
          title: "¡Biblioteca sincronizada!",
          description: `${result.gamesImported || 0} juegos importados exitosamente`,
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

  const copyExampleId = () => {
    navigator.clipboard.writeText('steamcommunity.com/id/tunombre');
    toast({
      title: "Copiado",
      description: "Ejemplo copiado al portapapeles",
    });
  };

  if (!showInstructions) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            Conecta tu Steam
          </CardTitle>
          <CardDescription className="text-lg">
            Importa tu biblioteca de juegos de Steam para descubrir tu próxima aventura
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">🎮 ¿Por qué conectar Steam?</h3>
            <ul className="text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                <span>Analiza tu biblioteca completa de juegos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                <span>Descubre juegos similares que te pueden gustar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                <span>Encuentra tu próximo juego basado en tu historial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
                <span>Organiza y filtra tu colección</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Privacidad</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Solo leemos tu lista de juegos. No accedemos a información personal 
              ni realizamos cambios en tu cuenta de Steam.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => setShowInstructions(true)}
              className="flex-1 h-12 text-lg"
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configurar Steam (Paso a paso)
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('https://steamcommunity.com/', '_blank')}
              className="h-12"
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>

          {!SteamService.isConfigured() && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">⚠️ Steam API no configurada</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-red-700">
                  Para importar bibliotecas reales de Steam, necesitas configurar una Steam API Key.
                </p>
                
                <div className="bg-white border border-red-200 rounded p-3">
                  <p className="text-sm font-semibold text-red-900 mb-2">🔑 Pasos para obtener tu API Key:</p>
                  <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                    <li>Ve a <code className="bg-red-100 px-1 rounded">steamcommunity.com/dev/apikey</code></li>
                    <li>Inicia sesión con tu cuenta de Steam</li>
                    <li>En "Domain Name" escribe <code className="bg-red-100 px-1 rounded">localhost</code></li>
                    <li>Acepta los términos y obtén tu API key</li>
                    <li>Agrega la key al archivo <code className="bg-red-100 px-1 rounded">.env</code> como <code className="bg-red-100 px-1 rounded">VITE_STEAM_API_KEY=tu_key</code></li>
                    <li>Reinicia la aplicación</li>
                  </ol>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://steamcommunity.com/dev/apikey', '_blank')}
                    className="bg-white hover:bg-red-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Obtener API Key
                  </Button>
                </div>
                
                <p className="text-xs text-red-600 border-t border-red-200 pt-2">
                  <strong>Nota:</strong> Esta API key la configura el desarrollador una sola vez. 
                  Todos los usuarios podrán usar la misma API key después.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Conectar Steam - Paso a paso</CardTitle>
              <CardDescription>
                Sigue estos pasos para conectar tu biblioteca de Steam
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowInstructions(false)}
            >
              Volver
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Steps */}
      <div className="grid gap-4">
        {steps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`transition-all ${
              currentStep === step.id 
                ? 'ring-2 ring-blue-500 shadow-md' 
                : currentStep > step.id 
                  ? 'bg-green-50 border-green-200' 
                  : 'opacity-60'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                      Paso {step.id}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{step.description}</p>
                  
                  {step.detail && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>📋 Detalles:</strong> {step.detail}
                      </p>
                    </div>
                  )}
                  
                  {step.tip && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tip:</strong> {step.tip}
                      </p>
                    </div>
                  )}
                  
                  {step.important && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Importante:</strong> {step.important}
                      </p>
                    </div>
                  )}
                  
                  {step.critical && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-red-800">
                        <strong>🚨 CRÍTICO:</strong> {step.critical}
                      </p>
                    </div>
                  )}
                  
                  {step.note && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>📝 Nota:</strong> {step.note}
                      </p>
                    </div>
                  )}
                  
                  {step.example && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>📋 Ejemplo:</strong>
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-white px-2 py-1 rounded text-sm flex-1">
                          {step.example}
                        </code>
                        <Button size="sm" variant="outline" onClick={copyExampleId}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {step.action && step.link && (
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(step.link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {step.action}
                      </Button>
                    )}
                    
                    {currentStep === step.id && (
                      <Button 
                        onClick={() => setCurrentStep(step.id + 1)}
                      >
                        {step.id === steps.length ? '¡Completado!' : 'Marcar como completado'}
                      </Button>
                    )}
                    
                    {currentStep > step.id && step.id < steps.length && (
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep(step.id)}
                        size="sm"
                      >
                        Revisar paso
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Steam ID Input */}
      {currentStep > steps.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              ¡Perfecto! Tu perfil está configurado
            </CardTitle>
            <CardDescription>
              Ahora puedes conectar tu biblioteca de Steam con Steam Compass
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ Configuración completada</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Tu perfil es público</li>
                <li>• Tu biblioteca de juegos es visible</li>
                <li>• Steam Compass puede leer tus datos</li>
                <li>• {steps.length > 7 ? 'Tu lista de deseados está disponible' : 'Lista de deseados configurada (opcional)'}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steamId">Steam ID o URL del Perfil</Label>
              <Input
                id="steamId"
                type="text"
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="steamcommunity.com/id/tunombre o solo tunombre"
                disabled={isLoading}
                className="text-lg h-12"
              />
              <p className="text-sm text-muted-foreground">
                Pega la URL completa de tu perfil o solo tu nombre de usuario
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🔄 Después de importar</h4>
              <p className="text-sm text-blue-800">
                Una vez importados tus juegos, puedes volver a hacer tu perfil privado si lo deseas. 
                Solo necesitas repetir este proceso si quieres actualizar tu biblioteca.
              </p>
            </div>

            <Button
              onClick={handleSync}
              disabled={isLoading || !steamId.trim()}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importando biblioteca...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  🎮 Importar mi biblioteca de Steam
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
