# Steam Compass API - Backend

Este directorio contiene el backend completo de Steam Compass, que maneja toda la lógica de obtención de datos externos.

## 🏗️ Arquitectura

```
api/
├── server.js                 # Servidor Express principal
├── services/
│   ├── gameMetricsService.js # Servicio coordinador principal
│   ├── metacriticService.js  # Servicio Metacritic
│   └── steamService.js       # Servicio Steam API
├── test.js                   # Archivo de pruebas
└── package.json              # Dependencias del backend
```

## 🚀 Inicio Rápido

### Desarrollo Local
```bash
# Desde el directorio api/
npm install
node server.js
```

### Usando los scripts de conveniencia
```bash
# Para Windows:
./start-dev.bat

# Para Linux/Mac:
./start-dev.sh
```

## 📡 Endpoints Disponibles

### Principal
- **GET** `/api/get-game-details?name=GameName&appid=12345&mode=complete`
  - Obtiene métricas completas de un juego
  - Parámetros:
    - `name` (requerido): Nombre del juego
    - `appid` (opcional): Steam App ID
    - `mode` (opcional): 'complete' o 'essential'

### Auxiliares
- **GET** `/api/health` - Health check del servidor
- **GET** `/api/metacritic-scores?name=GameName` - Solo scores de Metacritic
- **GET** `/api/metacritic-scores?name=GameName` - Solo scores de Metacritic

## 🔧 Servicios

### Metacritic Service
- Extrae Metascores y User Scores
- Web scraping inteligente con múltiples selectores
- Normalización automática de URLs

### Steam Service
- Obtiene reviews positivas/negativas
- Acceso directo a Steam Store API
- Información adicional del juego

### Game Metrics Service
- Coordina todos los servicios
- Cálculo inteligente de estrellas
- Procesamiento en paralelo para mayor velocidad

## 🎯 Características

- ✅ **Sin CORS**: Eliminación completa de problemas de CORS
- ⚡ **Rápido**: Procesamiento en paralelo de múltiples fuentes
- 🔄 **Resiliente**: Fallbacks automáticos en caso de errores
- 📊 **Completo**: Integración con Metacritic y Steam
- 🛡️ **Robusto**: Manejo de errores y validación de parámetros

## 🧪 Pruebas

```bash
# Ejecutar prueba básica
node test.js

# Probar endpoint específico
curl "http://localhost:3001/api/get-game-details?name=Dota%202&appid=570"
```

## 📝 Logs

El backend proporciona logs detallados:
- 🎮 Requests entrantes
- 📡 Llamadas a APIs externas
- ✅ Resultados exitosos
- ❌ Errores y fallbacks
- ⭐ Cálculos de métricas

## 🔧 Configuración

Las configuraciones principales están en cada servicio:
- `HORAS_MAX = 100` en gameMetricsService.js
- User-Agents específicos para cada servicio
- Timeouts y reintentos automáticos
