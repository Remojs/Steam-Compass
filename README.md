# 🧭 Steam Compass

**Tu brújula para navegar tu biblioteca de juegos de Steam**

Steam Compass es una aplicación web moderna que te ayuda a gestionar y optimizar tu biblioteca de juegos de Steam mediante métricas inteligentes y análisis de datos.

## 🚀 Estado del Proyecto

### ✅ **Implementado**
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: ShadcN/UI + TailwindCSS con paleta personalizada de Steam
- **Autenticación**: Sistema completo con Login/Register (mock)
- **Dashboard**: Tabla de juegos con filtros y ordenamiento
- **Routing**: React Router con rutas protegidas
- **Estado**: Context API para autenticación
- **Diseño**: Responsive design con tema Steam
- **Hooks personalizados**: `useAuth`, `useSortFilter`

### 🚧 **En Desarrollo**
- **Integración con APIs**:
  - Steam Web API para obtener biblioteca de juegos
  - Supabase como backend y base de datos
  - RAWG API para puntuaciones Metacritic
  - HowLongToBeat para estimación de horas

### 📋 **Por Implementar**
- **Backend Real**:
  - Configuración de Supabase
  - Autenticación JWT real
  - Base de datos con tablas `users`, `sessions`, `games`
- **Métricas Avanzadas**:
  - Sistema de estrellas personalizado
  - Análisis de reviews de Steam
  - Cálculo de tiempo de completado
- **Funcionalidades**:
  - Sincronización automática con Steam
  - Caché de datos para mejor performance
  - Paginación para bibliotecas grandes

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

### **Backend (Planificado)**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos
- **Steam Web API** - Datos de juegos
- **RAWG API** - Metacritic scores

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
- [ ] RAWG API para Metacritic
- [ ] HowLongToBeat integration
- [ ] Sistema de métricas

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
