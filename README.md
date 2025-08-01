# Steam Compass

🍀Developed by: **Thiago Zambonini**
</br>

<img src="https://i.pinimg.com/originals/f1/ed/a4/f1eda4768df8d8135c779772f2833e88.gif" alt="new gif" />

---

## 🎯 Objetivo

Aplicación web moderna para analizar y gestionar tu biblioteca de juegos de Steam mediante métricas inteligentes, con sistema de caché avanzado para cargas ultra-rápidas.

## 🛠️ Stack Tecnológico

### **Frontend**
- **React 18** + TypeScript - Framework principal con tipado estático
- **Vite** - Build tool moderno y dev server optimizado
- **TailwindCSS** + ShadcN/UI - Diseño responsive con componentes premium
- **React Router** - Navegación SPA con rutas protegidas
- **LocalStorage Caching** - Sistema de caché inteligente con expiración

### **Backend**
- **Node.js** + Express - API REST robusta y escalable
- **Cheerio** - Web scraping optimizado para Metacritic
- **Steam Store API** - Integración directa con datos de Steam
- **CORS** - Políticas de seguridad cross-origin

## ⚡ Funcionalidades Clave

- **Análisis de Métricas**: Combina Metacritic scores + Steam reviews para rating unificado
- **Caché Inteligente**: Primera carga ~60s, cargas posteriores <1s
- **Interfaz Simplificada**: Tabla optimizada con 6 columnas esenciales
- **Filtros Avanzados**: Ordenamiento por rating, score, nombre y reviews
- **Autenticación**: Sistema completo con login/register (mock)
- **Responsive Design**: Adaptado a todos los dispositivos

## 🚀 Inicio Rápido

```bash
# Clonar e instalar
git clone <repo-url>
cd SteamCompass
npm install

# Backend
cd api && npm install && node server.js

# Frontend (terminal separado)
npm run dev
```

**URLs:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
