// Configuración y constantes
const CONFIG = {
  CSV_URL: 'https://docs.google.com/spreadsheets/d/1sA83GLCHJcecgefsMhKMUPzIqE5WRGtroAO5RwmfhAE/export?format=csv',
  SPOTIFY_CLIENT_ID: 'tu-client-id-aqui', // Cambiar por tu cliente ID de Spotify
  SPOTIFY_REDIRECT_URI: window.location.origin + window.location.pathname,
  CACHE_NAME: 'music-discovery-cache-v1',
  CACHE_MAX_TRACKS: 50
};

// Estado de la aplicación
const AppState = {
  musicData: [],
  currentScreen: 'loading',
  currentStyle: null,
  currentSubstyle: null,
  spotifyToken: null,
  currentTrack: null,
  cache: new Map(),
  player: null
};

// Utilidades
const Utils = {
  parseCSV: (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    // Remove quotes from the first line and split by comma
    const headers = lines[0].replace(/"/g, '').split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        // Remove quotes and split by comma
        const values = line.replace(/"/g, '').split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  },

  groupByStyle: (data) => {
    const grouped = {};
    data.forEach(track => {
      const style = track.Estilo_Principal;
      if (!grouped[style]) {
        grouped[style] = [];
      }
      grouped[style].push(track);
    });
    return grouped;
  },

  groupBySubstyle: (tracks) => {
    const grouped = {};
    tracks.forEach(track => {
      const substyle = track['Sub-estilo'];
      if (!grouped[substyle]) {
        grouped[substyle] = [];
      }
      grouped[substyle].push(track);
    });
    return grouped;
  },

  formatDuration: (duration) => {
    return duration || '0:00';
  },

  generatePKCE: () => {
    const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => ('0' + b.toString(16)).substr(-2))
      .join('');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = crypto.subtle.digest('SHA-256', data).then(hash => {
      return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    });
    
    return { codeVerifier, codeChallenge: digest };
  }
};

// Gestión de datos
const DataManager = {
  loadMusicData: async () => {
    try {
      const response = await fetch(CONFIG.CSV_URL);
      const csvText = await response.text();
      AppState.musicData = Utils.parseCSV(csvText);
      return true;
    } catch (error) {
      console.error('Error loading music data:', error);
      return false;
    }
  },

  getStyles: () => {
    return Object.keys(Utils.groupByStyle(AppState.musicData));
  },

  getTracksByStyle: (style) => {
    return AppState.musicData.filter(track => track.Estilo_Principal === style);
  },

  getTracksBySubstyle: (style, substyle) => {
    return AppState.musicData.filter(track => 
      track.Estilo_Principal === style && track['Sub-estilo'] === substyle
    );
  }
};

// Gestión de pantallas
const ScreenManager = {
  showScreen: (screenId) => {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
      screen.classList.add('hidden');
    });
    
    // Mostrar pantalla actual
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      setTimeout(() => {
        targetScreen.classList.add('active');
      }, 50);
    }
    
    AppState.currentScreen = screenId;
  },

  showLoading: () => {
    ScreenManager.showScreen('loading-screen');
  },

  showMain: () => {
    ScreenManager.showScreen('main-screen');
  },

  showSubstyles: (style) => {
    AppState.currentStyle = style;
    const stylesTitle = document.getElementById('substyles-title');
    stylesTitle.textContent = style;
    ScreenManager.showScreen('substyles-screen');
    Renderer.renderSubstyles(style);
  },

  showTracks: (style, substyle) => {
    AppState.currentSubstyle = substyle;
    const tracksTitle = document.getElementById('tracks-title');
    tracksTitle.textContent = substyle;
    ScreenManager.showScreen('tracks-screen');
    Renderer.renderTracks(style, substyle);
  }
};

// Renderizado de contenido
const Renderer = {
  renderStyles: () => {
    const stylesGrid = document.getElementById('styles-grid');
    const groupedData = Utils.groupByStyle(AppState.musicData);
    
    stylesGrid.innerHTML = '';
    
    Object.entries(groupedData).forEach(([style, tracks]) => {
      const styleCard = document.createElement('div');
      styleCard.className = 'style-card';
      styleCard.onclick = () => ScreenManager.showSubstyles(style);
      
      const sampleTrack = tracks[0];
      styleCard.innerHTML = `
        <span class="style-emoji">${sampleTrack.Emoji || '🎵'}</span>
        <div class="style-name">${style}</div>
        <div class="style-count">${tracks.length} canciones</div>
      `;
      
      // Aplicar color de fondo si está disponible
      if (sampleTrack.Color) {
        styleCard.style.backgroundColor = sampleTrack.Color;
      }
      
      stylesGrid.appendChild(styleCard);
    });
  },

  renderSubstyles: (style) => {
    const substylesContainer = document.getElementById('substyles-container');
    const tracks = DataManager.getTracksByStyle(style);
    const groupedSubstyles = Utils.groupBySubstyle(tracks);
    
    substylesContainer.innerHTML = '';
    
    Object.entries(groupedSubstyles).forEach(([substyle, substyleTracks]) => {
      const substyleCard = document.createElement('div');
      substyleCard.className = 'substyle-card';
      substyleCard.onclick = () => ScreenManager.showTracks(style, substyle);
      
      const sampleTrack = substyleTracks[0];
      substyleCard.innerHTML = `
        <div class="substyle-name">${substyle}</div>
        <div class="substyle-info">${substyleTracks.length} canciones</div>
        <div class="substyle-info">${sampleTrack.Epoca || 'Varias épocas'}</div>
      `;
      
      substylesContainer.appendChild(substyleCard);
    });
  },

  renderTracks: (style, substyle) => {
    const tracksContainer = document.getElementById('tracks-container');
    const tracks = DataManager.getTracksBySubstyle(style, substyle);
    
    tracksContainer.innerHTML = '';
    
    tracks.forEach(track => {
      const trackCard = document.createElement('div');
      trackCard.className = 'track-card';
      
      trackCard.innerHTML = `
        <div class="track-header">
          <div class="track-cover">
            ${track.Emoji || '🎵'}
          </div>
          <div class="track-info-main">
            <div class="track-title">${track.Obra}</div>
            <div class="track-artist">${track.Artista}</div>
            <div class="track-review">${track.Mini_resena || 'Descubre esta maravillosa canción'}</div>
          </div>
        </div>
        <div class="track-details">
          <span>🎵 ${track.BPM || 'N/A'} BPM</span>
          <span>⏱️ ${Utils.formatDuration(track.Duración)}</span>
          <span>🌍 ${track.País || 'Desconocido'}</span>
          <span>📅 ${track.Epoca || 'Desconocida'}</span>
        </div>
        <div class="track-actions">
          <button class="play-btn" onclick="SpotifyManager.playPreview('${track.Spotify_URI}', '${track.Obra}', '${track.Artista}')">
            <span>▶️</span>
            <span>30s</span>
          </button>
          <button class="spotify-add-btn" onclick="SpotifyManager.addToPlaylist('${track.Spotify_URI}')" ${!AppState.spotifyToken ? 'disabled' : ''}>
            <span>➕</span>
            <span>Spotify</span>
          </button>
        </div>
      `;
      
      tracksContainer.appendChild(trackCard);
    });
  }
};

// Gestión de Spotify
const SpotifyManager = {
  init: () => {
    // Verificar si hay token en URL (callback de autenticación)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      SpotifyManager.handleAuthCallback(code);
    } else {
      // Verificar token en localStorage
      const token = localStorage.getItem('spotify_token');
      if (token) {
        AppState.spotifyToken = token;
        SpotifyManager.updateUI();
      }
    }
  },

  authenticate: async () => {
    const { codeVerifier, codeChallenge } = Utils.generatePKCE();
    
    // Guardar code verifier para usarlo después
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    
    const authUrl = new URL('https://accounts.spotify.com/authorize');
    authUrl.searchParams.set('client_id', CONFIG.SPOTIFY_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', CONFIG.SPOTIFY_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'playlist-read-private playlist-modify-private user-library-read');
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('code_challenge', await codeChallenge);
    
    window.location.href = authUrl.toString();
  },

  handleAuthCallback: async (code) => {
    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CONFIG.SPOTIFY_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: CONFIG.SPOTIFY_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      AppState.spotifyToken = tokenData.access_token;
      localStorage.setItem('spotify_token', AppState.spotifyToken);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      SpotifyManager.updateUI();
      SpotifyManager.initializePlayer();
    }
  },

  updateUI: () => {
    const loginBtn = document.getElementById('spotify-login');
    const addBtns = document.querySelectorAll('.spotify-add-btn');
    
    if (AppState.spotifyToken) {
      loginBtn.classList.add('hidden');
      addBtns.forEach(btn => btn.disabled = false);
    } else {
      loginBtn.classList.remove('hidden');
      addBtns.forEach(btn => btn.disabled = true);
    }
  },

  initializePlayer: () => {
    // Inicializar Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onload = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        AppState.player = new Spotify.Player({
          name: 'Descubre Música',
          getOAuthToken: cb => { cb(AppState.spotifyToken); }
        });
        
        AppState.player.connect();
      };
    };
    document.head.appendChild(script);
  },

  playPreview: (spotifyUri, trackName, artistName) => {
    const trackId = spotifyUri.split(':')[2];
    const previewUrl = `https://p.scdn.co/mp3-preview/${trackId}`;
    
    const audioPlayer = document.getElementById('preview-player');
    const playerContainer = document.getElementById('audio-player');
    const currentTrackName = document.getElementById('current-track-name');
    
    currentTrackName.textContent = `${trackName} - ${artistName}`;
    playerContainer.classList.remove('hidden');
    playerContainer.classList.add('active');
    
    audioPlayer.src = previewUrl;
    audioPlayer.play();
    
    AppState.currentTrack = { spotifyUri, trackName, artistName };
    
    // Auto-cerrar después de 30 segundos
    setTimeout(() => {
      SpotifyManager.closePlayer();
    }, 30000);
  },

  closePlayer: () => {
    const audioPlayer = document.getElementById('preview-player');
    const playerContainer = document.getElementById('audio-player');
    
    audioPlayer.pause();
    audioPlayer.src = '';
    playerContainer.classList.remove('active');
    setTimeout(() => {
      playerContainer.classList.add('hidden');
    }, 300);
    
    AppState.currentTrack = null;
  },

  addToPlaylist: async (spotifyUri) => {
    if (!AppState.spotifyToken) {
      alert('Por favor, conecta tu cuenta de Spotify primero');
      return;
    }
    
    try {
      // Buscar playlist "Descubiertos" o crearla
      let playlistId = await SpotifyManager.findOrCreatePlaylist();
      
      // Agregar canción a la playlist
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AppState.spotifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [spotifyUri]
        }),
      });
      
      if (response.ok) {
        // Mostrar notificación de éxito
        SpotifyManager.showNotification('¡Canción agregada a "Descubiertos"! 🎉');
      } else {
        throw new Error('Error al agregar canción');
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      SpotifyManager.showNotification('Error al agregar canción 😞');
    }
  },

  findOrCreatePlaylist: async () => {
    // Buscar playlists del usuario
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${AppState.spotifyToken}`,
      },
    });
    
    if (response.ok) {
      const playlists = await response.json();
      const discoveredPlaylist = playlists.items.find(p => p.name === 'Descubiertos');
      
      if (discoveredPlaylist) {
        return discoveredPlaylist.id;
      }
    }
    
    // Si no existe, crearla
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${AppState.spotifyToken}`,
      },
    });
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      
      const createResponse = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AppState.spotifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Descubiertos',
          description: 'Canciones descubiertas con Descubre Música',
          public: false,
        }),
      });
      
      if (createResponse.ok) {
        const newPlaylist = await createResponse.json();
        return newPlaylist.id;
      }
    }
    
    throw new Error('No se pudo crear la playlist');
  },

  showNotification: (message) => {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-medium);
      z-index: 1000;
      transform: translateX(100%);
      transition: var(--transition);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
};

// Service Worker para caché
const ServiceWorker = {
  register: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }
};

// Event Listeners
const EventListeners = {
  init: () => {
    // Botón de login de Spotify
    document.getElementById('spotify-login')?.addEventListener('click', SpotifyManager.authenticate);
    
    // Botones de navegación
    document.getElementById('back-to-styles')?.addEventListener('click', () => {
      ScreenManager.showMain();
    });
    
    document.getElementById('back-to-substyles')?.addEventListener('click', () => {
      ScreenManager.showSubstyles(AppState.currentStyle);
    });
    
    // Controles del reproductor
    document.getElementById('play-pause')?.addEventListener('click', () => {
      const audioPlayer = document.getElementById('preview-player');
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    });
    
    document.getElementById('close-player')?.addEventListener('click', SpotifyManager.closePlayer);
    
    // Prevenir cierre accidental con música reproduciéndose
    window.addEventListener('beforeunload', (e) => {
      if (AppState.currentTrack) {
        e.preventDefault();
        e.returnValue = '¿Seguro que quieres salir? Se detendrá la música.';
      }
    });
  }
};

// Inicialización de la aplicación
const App = {
  init: async () => {
    try {
      // Mostrar pantalla de carga
      ScreenManager.showLoading();
      
      // Cargar datos
      const dataLoaded = await DataManager.loadMusicData();
      
      if (dataLoaded) {
        // Inicializar UI
        Renderer.renderStyles();
        SpotifyManager.init();
        EventListeners.init();
        ServiceWorker.register();
        
        // Mostrar pantalla principal
        ScreenManager.showMain();
      } else {
        alert('Error al cargar los datos de música. Por favor, recarga la página.');
      }
    } catch (error) {
      console.error('App initialization error:', error);
      alert('Error al iniciar la aplicación. Por favor, recarga la página.');
    }
  }
};

// Iniciar aplicación cuando DOM esté listo
document.addEventListener('DOMContentLoaded', App.init);