// Test manual de Supabase - Ejecutar en la consola del navegador
// Copiar y pegar estas líneas una por una

// 1. Verificar que las variables de entorno se cargaron
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// 2. Test de conexión básica
fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
  }
})
.then(response => {
  console.log('Conexión con Supabase:', response.ok ? '✅ Exitosa' : '❌ Falló');
  return response.text();
})
.then(data => console.log('Respuesta:', data))
.catch(error => console.error('Error:', error));
