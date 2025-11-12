# Descubre Música - PWA para Niños

Una aplicación web progresiva (PWA) diseñada para que los niños descubran nueva música de forma divertida y educativa.

## Características

- ✅ **Diseño amigable para niños**: Interfaz colorida y juguetona con emojis y colores personalizados
- ✅ **Navegación intuitiva**: 3 niveles de navegación (Estilos → Sub-estilos → Canciones)
- ✅ **Integración con Spotify**: Autenticación PKCE sin backend
- ✅ **Vistas previas de 30 segundos**: Reproducción de fragmentos de canciones
- ✅ **Gestión de playlists**: Añadir canciones a playlist "Descubiertos"
- ✅ **PWA completa**: Instalable, funciona offline, service worker
- ✅ **Responsive**: Diseño adaptable a todos los dispositivos
- ✅ **Rendimiento optimizado**: Bundle < 200kB, caché inteligente

## Estructura del Proyecto

```
music-discovery-pwa/
├── index.html              # Página principal
├── main.js                 # Lógica de la aplicación
├── styles.css              # Estilos con CSS variables
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker
├── icon-192.png            # Icono 192x192
├── icon-512.png            # Icono 512x512 (maskable)
├── package.json            # Configuración del proyecto
├── vite.config.js          # Configuración de Vite
└── README.md               # Este archivo
```

## Instalación y Uso

### Desarrollo Local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`

3. **Construir para producción**:
   ```bash
   npm run build
   ```
   Los archivos generados estarán en la carpeta `dist/`

### Despliegue en GitHub Pages

1. **Configurar el repositorio**:
   ```bash
   git init
   git remote add origin https://github.com/tu-usuario/tu-repositorio.git
   ```

2. **Desplegar**:
   ```bash
   npm run deploy
   ```

## Personalización

### Cambiar la URL del CSV

Edita la constante `CSV_URL` en `main.js`:

```javascript
const CONFIG = {
  CSV_URL: 'https://docs.google.com/spreadsheets/d/TU-ID-DE-HOJA/export?format=csv',
  // ...
};
```

**Formato esperado del CSV**:
- `Estilo_Principal`: Categoría principal (ej: "clásica", "jazz")
- `Sub-estilo`: Subcategoría (ej: "barroco", "bebop")
- `Artista`: Nombre del artista
- `Obra`: Título de la canción
- `Spotify_URI`: URI de Spotify (ej: "spotify:track:6JQd...")
- `Mini_reseña`: Descripción breve (5 palabras)
- `Color`: Color hexadecimal para la tarjeta
- `Emoji`: Emoji representativo
- `BPM`: Beats por minuto
- `Duración`: Duración en formato MM:SS
- `Época`: Año o período histórico
- `País`: País de origen

### Cambiar la Paleta de Colores

Edita las variables CSS en `styles.css`:

```css
:root {
  --primary-color: #FF6B6B;      /* Color principal */
  --secondary-color: #4ECDC4;    /* Color secundario */
  --accent-color: #45B7D1;       /* Color de acento */
  --background-color: #F7F9FC;   /* Fondo */
  --surface-color: #FFFFFF;      /* Superficies */
  --text-primary: #2C3E50;       /* Texto principal */
  --text-secondary: #7F8C8D;     /* Texto secundario */
}
```

### Configurar Spotify

1. **Crear aplicación en Spotify Developer**:
   - Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Crea una nueva aplicación
   - Añade `http://localhost:3000/` como redirect URI

2. **Actualizar el Client ID**:
   ```javascript
   const CONFIG = {
     SPOTIFY_CLIENT_ID: 'tu-client-id-real-aqui',
     // ...
   };
   ```

## Funcionalidades Avanzadas

### Service Worker

El Service Worker (`sw.js`) proporciona:
- ✅ Caché de assets estáticos
- ✅ Caché dinámico de hasta 50 tracks
- ✅ Funcionamiento offline
- ✅ Sincronización en segundo plano

### Características de la App

- **Navegación**: 3 niveles (Estilos → Sub-estilos → Canciones)
- **Reproducción**: Controles de audio integrados
- **Gestión de playlists**: Crea y gestiona tu playlist "Descubiertos"
- **Responsive**: Funciona en móviles, tablets y desktop
- **PWA**: Instalable como app nativa

## Solución de Problemas

### Spotify no funciona
1. Verifica que el Client ID es correcto
2. Asegúrate de que el redirect URI está configurado
3. Comprueba que la aplicación tiene los permisos necesarios

### Los datos no cargan
1. Verifica que la hoja de cálculo es pública
2. Comprueba el formato del CSV
3. Revisa la consola del navegador para errores

### La PWA no se instala
1. Verifica que el sitio usa HTTPS
2. Comprueba que el manifest.json es válido
3. Asegúrate de que los iconos existen

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Créditos

- Diseño e implementación: [Tu nombre]
- Inspiración en aplicaciones educativas para niños
- Agradecimientos a la comunidad de desarrolladores web

---

**¡Disfruta descubriendo nueva música!** 🎵