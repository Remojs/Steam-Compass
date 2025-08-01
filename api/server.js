import express from 'express';
import cors from 'cors';
import { fetchCompleteGameMetrics, fetchEssentialGameMetrics } from './services/gameMetricsService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
  req.startTime = Date.now();
  console.log(`\n🌐 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Endpoint principal para obtener métricas de juegos
app.get('/api/get-game-details', async (req, res) => {
  try {
    const { name, appid, mode = 'complete' } = req.query;
    
    // Validar parámetros requeridos
    if (!name) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Game name is required' 
      });
    }
    
    const gameAppId = appid ? parseInt(appid, 10) : null;
    if (appid && isNaN(gameAppId)) {
      return res.status(400).json({ 
        error: 'Invalid parameters',
        message: 'appid must be a valid number' 
      });
    }
    
    console.log(`🎮 [API] Procesando: ${name} (appid: ${gameAppId}, modo: ${mode})`);
    
    let result;
    
    // Elegir el modo de obtención de datos
    if (mode === 'essential' || mode === 'fast') {
      result = await fetchEssentialGameMetrics(gameAppId, name);
    } else {
      result = await fetchCompleteGameMetrics(gameAppId, name);
    }
    
    // Agregar metadata de respuesta
    const response = {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        mode,
        processingTime: Date.now() - req.startTime
      }
    };
    
    console.log(`✅ [API] Respuesta enviada para: ${name} (${Date.now() - req.startTime}ms)`);
    
    return res.status(200).json(response);
    
  } catch (error) {
    console.error(`❌ [API] Error interno:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - req.startTime
      }
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint para obtener solo scores de Metacritic (más rápido)
app.get('/api/metacritic-scores', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    
    const { getMetacriticScores } = await import('./services/metacriticService.js');
    const scores = await getMetacriticScores(name);
    
    res.json({ 
      gameName: name,
      ...scores,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting Metacritic scores:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET /api/get-game-details?name=GameName&appid=12345',
      'GET /api/health',
      'GET /api/metacritic-scores?name=GameName'
    ]
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('❌ [Server] Error no manejado:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 [Steam Compass API] Servidor iniciado en puerto ${PORT}`);
  console.log(`📡 Endpoint principal: http://localhost:${PORT}/api/get-game-details`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n📋 Rutas disponibles:`);
  console.log(`   GET /api/get-game-details?name=GameName&appid=12345&mode=complete`);
  console.log(`   GET /api/metacritic-scores?name=GameName`);
  console.log(`   GET /api/health`);
});

export default app;
