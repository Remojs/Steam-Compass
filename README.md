# 🧭 Steam Compass

**Tu brújula para navegar tu biblioteca de juegos de Steam**

Steam Compass es una aplicación web moderna que te ayuda a gestionar y optimizar tu biblioteca de juegos de Steam mediante métricas inteligentes y análisis de datos en tiempo real.

## 🚀 Estado del Proyecto

### ✅ **Implementado**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend API**: Node.js + Express con arquitectura de microservicios
- **UI Library**: ShadcN/UI + TailwindCSS con paleta personalizada de Steam
- **Autenticación**: Sistema completo con Login/Register (mock)
- **Dashboard**: Tabla de juegos con filtros y ordenamiento
- **Integración de APIs**:
  - ✅ Metacritic para puntuaciones y reviews
  - ✅ Steam Store API para reviews y detalles
- **Routing**: React Router con rutas protegidas
- **Estado**: Context API para autenticación
- **Diseño**: Responsive design con tema Steam
- **Hooks personalizados**: `useAuth`, `useSortFilter`

### 🚧 **En Desarrollo**
- **Optimizaciones**:
  - Caché de respuestas del backend
  - Procesamiento batch de múltiples juegos
  - Mejoras en los selectores de Metacritic

### 📋 **Por Implementar**
- **Backend Real con Supabase**:
  - Configuración de Supabase
  - Autenticación JWT real
  - Base de datos con tablas `users`, `sessions`, `games`
- **Funcionalidades Avanzadas**:
  - Sincronización automática con Steam
  - Análisis de tendencias de gaming
  - Recomendaciones personalizadas

## 🏗️ Arquitectura

### **Nueva Arquitectura (Frontend + Backend)**
```
SteamCompass/
├── src/                          # Frontend React
│   ├── components/
│   ├── services/
│   │   └── gameMetricsService.ts # Cliente simplificado
│   └── ...
├── api/                          # Backend Node.js
│   ├── server.js                 # Servidor Express
│   ├── services/
│   │   ├── gameMetricsService.js # Coordinador principal
│   │   ├── metacriticService.js  # Metacritic scraping
│   │   ├── metacriticService.js  # Metacritic scraping
│   │   └── steamService.js       # Steam API
│   └── package.json
└── ...
```

### **Flujo de Datos**
1. Frontend solicita métricas → `http://localhost:3001/api/get-game-details`
2. Backend coordina llamadas a:
   - Metacritic (web scraping para scores)
   - Steam Store API (reviews y detalles)
3. Backend procesa y combina datos
4. Frontend recibe respuesta unificada

## 🛠️ Tecnologías

### **Frontend**
- **React 18** - Biblioteca principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **TailwindCSS** - Framework CSS
- **ShadcN/UI** - Componentes UI
- **React Router** - Enrutamiento
- **Tanstack Query** - Manejo de estado del servidor
- **Lucide React** - Iconografía

### **Backend**
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Cheerio** - Web scraping para Metacritic
- **Cheerio** - Web scraping para Metacritic
- **CORS** - Manejo de políticas de origen cruzado

### **Backend Futuro (Planificado)**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos
- **Steam Web API** - Datos de juegos

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 20+ 
- npm o yarn

### Instalación y Ejecución

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd SteamCompass
```

2. **Instalar dependencias del frontend**
```bash
npm install
```

3. **Instalar dependencias del backend**
```bash
cd api
npm install
cd ..
```

4. **Ejecutar ambos servidores**

**Opción 1: Scripts automáticos**
```bash
# Windows
./start-dev.bat

# Linux/Mac
./start-dev.sh
```

**Opción 2: Manualmente**
```bash
# Terminal 1: Backend
cd api
node server.js

# Terminal 2: Frontend (en otra terminal)
npm run dev
```

5. **Abrir en el navegador**
- Frontend: http://localhost:8080 (o 8081 si 8080 está ocupado)
- Backend API: http://localhost:3001

### Comandos Útiles

```bash
# Solo frontend
npm run dev

# Solo backend
npm run api

# Probar backend
npm run api:test

# Build para producción
npm run build
```

## 🧪 Pruebas

### Probar Backend
```bash
cd api
node test.js
```

### Probar Endpoints Específicos
```bash
# Health check
curl http://localhost:3001/api/health

# Obtener métricas de un juego
curl "http://localhost:3001/api/get-game-details?name=Dota%202&appid=570"
```

## 🏗️ Arquitectura

```
src/
├── components/           # Componentes React
│   ├── Auth/            # Login, Register, AuthContainer
│   ├── Dashboard/       # Dashboard, GameTable, Filters
│   └── ui/             # Componentes UI base (ShadcN)
├── hooks/              # Hooks personalizados
├── services/           # API services y fetch logic
├── lib/               # Utilidades y helpers
└── pages/             # Páginas principales
```

## 🚀 Instalación y Uso

### **Prerequisitos**
- Node.js 18+
- npm o yarn

### **Instalación**
```bash
# Clonar repositorio
git clone [repo-url]
cd steam-compass

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### **Variables de Entorno**
Copia `.env.example` a `.env` y configura:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STEAM_API_KEY=your_steam_api_key
VITE_RAWG_API_KEY=your_rawg_api_key
```

## 📊 Schema de Base de Datos

```sql
-- Usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  username VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  steam_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sesiones
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- Juegos con métricas
CREATE TABLE games (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  appid INTEGER NOT NULL,
  name VARCHAR NOT NULL,
  cover_url VARCHAR,
  playtime_forever INTEGER,
  hours_to_beat INTEGER,
  metacritic_score INTEGER,
  positive_reviews INTEGER,
  negative_reviews INTEGER,
  stars_rating DECIMAL(2,1),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Design System

### **Paleta de Colores Steam**
- **Background**: `#171A21` (Steam dark)
- **Primary**: `#66C0F4` (Steam blue)
- **Accent**: `#1F7ACC` (Accent blue)
- **Foreground**: `#FFFFFF` (White text)
- **Muted**: `#C6D4DF` (Light grey)

### **Componentes UI Utilizados**
- `Button`, `Input`, `Card`, `Label`
- `Toast`, `Tooltip`, `Dialog`
- `Separator`, `Skeleton`, `Toggle`

## 🔄 Roadmap

### **v0.2.0 - Backend Integration**
- [ ] Configurar Supabase
- [ ] Implementar autenticación real
- [ ] Crear esquema de base de datos

### **v0.3.0 - Steam API**
- [ ] Integrar Steam Web API
- [ ] Obtener biblioteca real de juegos
- [ ] Sistema de caché

### **v0.4.0 - External APIs**
- [ ] RAWG API para Metacritic alternativo
- [ ] Sistema de métricas mejorado

### **v1.0.0 - Production Ready**
- [ ] Optimización de performance
- [ ] Testing completo
- [ ] Deployment en producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Add nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con ❤️ para la comunidad de Steam**
