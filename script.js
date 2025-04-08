// Effet de parallaxe - Version optimisée
// Configuration des éléments parallaxe avec memoization

const config = {
  background: {
    elements: [
      "background-paralax", "paralax-zelda-background", "paralax-link-character-background", "paralax-ganondorf-background"
    ],
    moveFactorX: 0.03,
    moveFactorY: 0,
    centerDivisorX: 3,
    centerDivisorY: 3,
    smoothingFactor: 0.1,
    blurEnabled: true,
    maxBlur: 5
  },
  character: {
    elements: [
      "link-paralax", "paralax-zelda-character", "paralax-link-character", "paralax-ganondorf-character"
    ],
    moveFactorX: 0.015,
    moveFactorY: 0,
    centerDivisorX: 2,
    centerDivisorY: 2,
    smoothingFactor: 0.05,
    blurEnabled: false,
    maxBlur: 0.5
  },
  gyroscope: {
    enabled: true,
    sensitivityX: 10,
    sensitivityY: 100,
    maxAngleX: 25,
    maxAngleY: 25,
    smoothingFactor: 0.2,
    throttleRate: 30
  }
};

// Utilisation d'un objet state pour centraliser l'état
const state = {
  mouseX: 0, 
  mouseY: 0,
  gyroX: 0, 
  gyroY: 0,
  currentX: 0, 
  currentY: 0,
  animationFrameId: null,
  edgeThreshold: 0.2,
  isUsingGyro: false,
  initialGyroX: null,
  initialGyroY: null,
  gyroInitialized: false,
  lastGyroUpdateTime: 0,
  hasMouseMoved: false,
  backgroundElements: [],
  characterElements: [],
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight
};

// Utilisation d'une fonction pour mettre en cache les éléments DOM
function cacheElements() {
  // Utiliser la méthode map plutôt qu'une boucle for each pour créer des tableaux de références DOM
  state.backgroundElements = config.background.elements.map(id => document.getElementById(id)).filter(Boolean);
  state.characterElements = config.character.elements.map(id => document.getElementById(id)).filter(Boolean);
}

// Détection de mobile - optimisée pour n'être exécutée qu'une seule fois
const isMobileDevice = (function() {
  const check = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return () => check;
})();

// Fonction throttle réutilisable et optimisée
function throttle(callback, delay) {
  return function() {
    const now = Date.now();
    if (now - state.lastGyroUpdateTime >= delay) {
      state.lastGyroUpdateTime = now;
      callback.apply(this, arguments);
    }
  };
}

// Ajouter des transitions CSS aux éléments de manière optimisée
function setupElements() {
  // Appliquer uniquement si les éléments ne sont pas encore configurés
  [...state.backgroundElements, ...state.characterElements].forEach(element => {
    if (element && !element.dataset.parallaxSetup) {
      element.style.transition = "transform 200ms cubic-bezier(0.33, 1, 0.68, 1), filter 300ms ease-out";
      element.dataset.parallaxSetup = "true";
    }
  });
}

// Fonction optimisée pour calculer la proximité au bord
function calculateEdgeProximity() {
  // Normaliser les coordonnées entre 0 et 1
  const normalizedX = state.currentX / state.windowWidth;
  const normalizedY = state.currentY / state.windowHeight;
  
  // Calculer la distance au centre (0.5, 0.5)
  const distanceX = Math.abs(normalizedX - 0.5) * 2;
  
  // Si moveFactorY est 0, ignorer l'axe Y dans le calcul
  const distanceY = config.background.moveFactorY === 0 && config.character.moveFactorY === 0 ? 
                    0 : Math.abs(normalizedY - 0.5) * 2;
  
  // Retourner la proximité au bord et la direction
  return {
    proximity: Math.max(distanceX, distanceY),
    direction: {
      x: normalizedX < 0.5 ? 1 : -1,
      y: normalizedY < 0.5 ? 1 : -1
    }
  };
}

// Gestionnaire d'événements optimisé pour la souris avec debouncing
const updateMousePosition = throttle(function(event) {
  state.isUsingGyro = false;
  state.mouseX = event.clientX;
  state.mouseY = event.clientY;
  state.hasMouseMoved = true;
  
  // Démarrer l'animation si elle n'est pas déjà en cours
  if (!state.animationFrameId) {
    state.animationFrameId = requestAnimationFrame(updateParallax);
  }
}, 16); // Limite à environ 60 FPS

// Gestionnaire de gyroscope optimisé
const handleGyroscope = throttle(function(event) {
  if (!config.gyroscope.enabled) return;
  
  // Ne traiter que les événements du gyroscope si approprié
  if (isMobileDevice() || !state.hasMouseMoved) {
    state.isUsingGyro = true;
    
    // Limiter les angles aux valeurs configurées
    const betaAngle = Math.max(-config.gyroscope.maxAngleX, Math.min(config.gyroscope.maxAngleX, event.beta));
    const gammaAngle = Math.max(-config.gyroscope.maxAngleY, Math.min(config.gyroscope.maxAngleY, event.gamma));
    
    // Enregistrer la position initiale au premier événement
    if (!state.gyroInitialized && state.initialGyroX === null && state.initialGyroY === null) {
      state.initialGyroX = gammaAngle;
      state.initialGyroY = betaAngle;
      state.gyroInitialized = true;
    }
    
    // Calculer le delta par rapport à la position initiale
    const deltaY = betaAngle - state.initialGyroY;
    const deltaX = gammaAngle - state.initialGyroX;
    
    // Convertir ces deltas en coordonnées d'écran
    state.gyroY = ((deltaY + config.gyroscope.maxAngleX) / (2 * config.gyroscope.maxAngleX)) * state.windowHeight;
    state.gyroX = ((deltaX + config.gyroscope.maxAngleY) / (2 * config.gyroscope.maxAngleY)) * state.windowWidth;
    
    // Démarrer l'animation si nécessaire
    if (!state.animationFrameId) {
      state.animationFrameId = requestAnimationFrame(updateParallax);
    }
  }
}, config.gyroscope.throttleRate);

// Fonction optimisée de mise à jour de l'effet parallaxe
function updateParallax() {
  // Utiliser soit la position de la souris, soit celle du gyroscope
  const targetX = state.isUsingGyro ? state.gyroX : state.mouseX;
  const targetY = state.isUsingGyro ? state.gyroY : state.mouseY;
  
  // Appliquer un lissage différent selon la source d'entrée
  const smoothing = state.isUsingGyro ? config.gyroscope.smoothingFactor : 0.1;
  
  // Appliquer un lissage à la position actuelle avec optimisation
  state.currentX += (targetX - state.currentX) * smoothing;
  state.currentY += (targetY - state.currentY) * smoothing;
  
  // Calculer la proximité au bord et la direction
  const edge = calculateEdgeProximity();
  
  // N'appliquer le flou que lorsque la souris est proche du bord
  const edgeEffect = edge.proximity > state.edgeThreshold ? 
    (edge.proximity - state.edgeThreshold) / (1 - state.edgeThreshold) : 0;

  // Optimisation: préparer les transformations en batch pour minimiser le reflow
  
  // Mettre à jour les éléments de personnage
  state.characterElements.forEach(element => {
    // Appliquer le parallaxe
    const offsetX = (state.currentX - state.windowWidth / config.character.centerDivisorX) * config.character.moveFactorX;
    const offsetY = (state.currentY - state.windowHeight / config.character.centerDivisorY) * config.character.moveFactorY;
    
    // Style batching pour éviter les multiples reflows
    const transform = `translate(${offsetX}px, ${offsetY}px)`;
    let filter = 'none';
    
    // Appliquer le flou directionnel si activé
    if (config.character.blurEnabled && edgeEffect > 0) {
      const blurAmount = edgeEffect * config.character.maxBlur;
      filter = `blur(${blurAmount}px)`;
    }
    
    // Appliquer les styles en une seule fois
    requestAnimationFrame(() => {
      element.style.transform = transform;
      element.style.filter = filter;
    });
  });
  
  // Mettre à jour les éléments d'arrière-plan
  state.backgroundElements.forEach(element => {
    const offsetX = (state.currentX - state.windowWidth / config.background.centerDivisorX) * config.background.moveFactorX;
    const offsetY = (state.currentY - state.windowHeight / config.background.centerDivisorY) * config.background.moveFactorY;
    
    // Style batching pour éviter les multiples reflows
    const transform = `translate(${offsetX}px, ${offsetY}px)`;
    let filter = 'none';
    
    // Appliquer le flou directionnel si activé pour l'arrière-plan
    if (config.background.blurEnabled && edgeEffect > 0) {
      const blurAmount = edgeEffect * config.background.maxBlur;
      filter = `blur(${blurAmount}px)`;
    }
    
    // Appliquer les styles en une seule fois
    requestAnimationFrame(() => {
      element.style.transform = transform;
      element.style.filter = filter;
    });
  });
  
  // Continuer l'animation
  state.animationFrameId = requestAnimationFrame(updateParallax);
}

// NOUVELLE FONCTION - Créer UI de permission gyroscope créée via lazy loading
function createPermissionUI() {
  // Si la popup existe déjà, ne pas la recréer
  if (document.getElementById('gyro-permission-popup')) return;
  
  // Ne créer la popup que si l'appareil est un mobile ou une tablette
  if (!isMobileDevice()) return;
  
  // Créer l'élément de popup avec création différée
  const popupTemplate = document.createElement('template');
  popupTemplate.innerHTML = `
      <div id="gyro-permission-popup">
          <div class="popup-content">
              <h3>EFFET GYROSCOPIQUE</h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#FFFDE4" class="bi bi-phone-flip" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M11 1H5a1 1 0 0 0-1 1v6a.5.5 0 0 1-1 0V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a.5.5 0 0 1-1 0V2a1 1 0 0 0-1-1m1 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a.5.5 0 0 0-1 0v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a.5.5 0 0 0-1 0zM1.713 7.954a.5.5 0 1 0-.419-.908c-.347.16-.654.348-.882.57C.184 7.842 0 8.139 0 8.5c0 .546.408.94.823 1.201.44.278 1.043.51 1.745.696C3.978 10.773 5.898 11 8 11q.148 0 .294-.002l-1.148 1.148a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708l1.145 1.144L8 10c-2.04 0-3.87-.221-5.174-.569-.656-.175-1.151-.374-1.47-.575C1.012 8.639 1 8.506 1 8.5c0-.003 0-.059.112-.17.115-.112.31-.242.6-.376Zm12.993-.908a.5.5 0 0 0-.419.908c.292.134.486.264.6.377.113.11.113.166.113.169s0 .065-.13.187c-.132.122-.352.26-.677.4-.645.28-1.596.523-2.763.687a.5.5 0 0 0 .14.99c1.212-.17 2.26-.43 3.02-.758.38-.164.713-.357.96-.587.246-.229.45-.537.45-.919 0-.362-.184-.66-.412-.883s-.535-.411-.882-.571M7.5 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
              </svg>
              <p>Autorisez l'accès au gyroscope, pour une expérience immersive.</p>
              <button id="gyro-permission-btn" class="bouton-classique">AUTORISER</button>
              <button id="gyro-permission-btn-refuser">Refuser</button>
          </div>
      </div>
  `;
  
  // Utiliser un fragment pour éviter les reflows multiples
  const fragment = document.createDocumentFragment();
  fragment.appendChild(popupTemplate.content.cloneNode(true));
  document.body.appendChild(fragment);
  
  // Ajouter les écouteurs d'événements de façon efficace
  const popup = document.getElementById('gyro-permission-popup');
  const acceptBtn = document.getElementById('gyro-permission-btn');
  const refuseBtn = document.getElementById('gyro-permission-btn-refuser');
  
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function() {
      requestGyroscopePermission();
      popup.classList.add('fade-out');
      setTimeout(() => {
        if (popup && popup.parentNode) {
          document.body.removeChild(popup);
        }
      }, 500);
      document.querySelectorAll('.expandBtn').forEach(btn => btn.classList.add('active'));
    }, { once: true }); // L'option once:true permet d'éviter les fuites mémoire
  }
  
  if (refuseBtn) {
    refuseBtn.addEventListener('click', function() {
      localStorage.setItem('gyroscopePermissionRefused', 'true');
      popup.classList.add('fade-out');
      setTimeout(() => {
        if (popup && popup.parentNode) {
          document.body.removeChild(popup);
        }
      }, 500);
    }, { once: true });
  }
}

// Optimisation de la fonction de demande de permission gyroscope
function requestGyroscopePermission() {
  // Réinitialiser les valeurs
  state.initialGyroX = null;
  state.initialGyroY = null;
  state.gyroInitialized = false;
  
  if (!window.DeviceOrientationEvent) {
    console.log("Le gyroscope n'est pas disponible sur cet appareil");
    return;
  }
  
  // Pour iOS 13+ qui nécessite une permission explicite
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleGyroscope, { passive: true });
        }
      })
      .catch(console.error);
  } else {
    // Pour les autres navigateurs 
    window.addEventListener('deviceorientation', handleGyroscope, { passive: true });
  }
}

// Gestion du redimensionnement de la fenêtre avec debounce
const handleResize = throttle(function() {
  state.windowWidth = window.innerWidth;
  state.windowHeight = window.innerHeight;
}, 250);

// Initialisation optimisée avec chargement différé
function init() {
  // Mettre à jour l'état initial
  state.lastGyroUpdateTime = Date.now();
  state.windowWidth = window.innerWidth;
  state.windowHeight = window.innerHeight;
  
  // Mise en cache des éléments DOM
  cacheElements();
  
  // Configuration des transitions
  setupElements();
  
  // Écouter les événements de la souris avec option passive pour améliorer la performance
  document.addEventListener("mousemove", updateMousePosition, { passive: true });
  
  // Écouter les événements de redimensionnement
  window.addEventListener("resize", handleResize, { passive: true });
  
  // Initialiser le gyroscope ou démarrer l'animation
  if (isMobileDevice()) {
    // Attendre que l'interface soit prête avant de demander les permissions
    if (document.readyState === 'complete') {
      setTimeout(createPermissionUI, 1000);
    } else {
      window.addEventListener('load', () => setTimeout(createPermissionUI, 1000), { once: true });
    }
  } else {
    // Démarrer l'animation si pas sur mobile
    state.animationFrameId = requestAnimationFrame(updateParallax);
  }
  
  // Nettoyer les ressources à la fermeture
  window.addEventListener("beforeunload", cleanup);
  
  // Initialiser les boutons expand
  document.querySelectorAll('.expandBtn').forEach(btn => {
    btn.addEventListener("click", () => btn.classList.toggle('expanded'), { passive: true });
  });
}

// Fonction de nettoyage
function cleanup() {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
  
  // Supprimer les écouteurs d'événements
  document.removeEventListener("mousemove", updateMousePosition);
  window.removeEventListener('deviceorientation', handleGyroscope);
  window.removeEventListener("resize", handleResize);
}

// Initialiser après le chargement du DOM pour éviter de bloquer le rendu
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}



                // document.addEventListener("mousemove", (event) => {
                //   const parallaxElement = document.getElementById("link-paralax");
                //   if (!parallaxElement) return;
                  
                //   const moveFactorX = 0.03; // Facteur de parallaxe
                //   const moveFactorY = 0.01;
                //   const { clientX, clientY } = event;
                  
                //   const windowWidth = window.innerWidth;
                //   const windowHeight = window.innerHeight;
                  
                //   const offsetX = (clientX - windowWidth / 3) * moveFactorX;
                //   const offsetY = (clientY - windowHeight / 3) * moveFactorY;
                  
                //   parallaxElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                // });

                // document.addEventListener("mousemove", (event) => {
                //   const parallaxElement = document.getElementById("background-paralax");
                //   if (!parallaxElement) return;
                  
                //   const moveFactorX = 0.015; // Facteur de parallaxe
                //   const moveFactorY = 0;
                //   const { clientX, clientY } = event;
                  
                //   const windowWidth = window.innerWidth;
                //   const windowHeight = window.innerHeight;
                  
                //   const offsetX = (clientX - windowWidth / 2) * moveFactorX;
                //   const offsetY = (clientY - windowHeight / 2) * moveFactorY;
                  
                //   parallaxElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                // });


/**
 * SliderInteraction - Version optimisée
 * Améliore les performances en réduisant les opérations DOM et en utilisant
 * des techniques modernes de gestion des événements
 */

// Fonction d'initialisation optimisée avec délégation d'événements
const sliderInteraction = () => {
  // Cache des sélecteurs DOM fréquemment utilisés
  const sliders = document.querySelectorAll(".slider");
  if (!sliders.length) return;
  
  // Utiliser un Map pour conserver les références aux éléments actifs
  const activeElements = new Map();
  
  // Préparation et mise en cache des éléments pour chaque slider
  sliders.forEach(slider => {
    // Mise en cache des éléments pour minimiser les requêtes DOM
    const sliderElements = {
      buttons: Array.from(slider.querySelectorAll(".nav-button")),
      videos: Array.from(slider.querySelectorAll(".video-slide")),
      titles: Array.from(slider.querySelectorAll(".title-slide")),
      slides: Array.from(slider.querySelectorAll(".slide")),
      navExplorer: document.querySelector(".nav-explorer"), // À l'extérieur du slider
      subSlider: document.querySelector(".sub-slider")      // À l'extérieur du slider
    };
    
    // Si aucun bouton n'est trouvé, ignorer ce slider
    if (!sliderElements.buttons.length) return;
    
    // Créer un index pour accélérer la recherche d'éléments par ID
    const elementsById = {};
    
    // Indexation des boutons par ID
    sliderElements.buttons.forEach(btn => {
      const id = btn.id;
      if (!id) return;
      
      elementsById[id] = {
        button: btn,
        text: btn.querySelector(".nav-button-text"),
        img: btn.querySelector(".nav-button-img"),
        video: document.getElementById(`video-${id}`),
        title: document.getElementById(`title-${id}`),
        slide: document.getElementById(`slide-${id}`)
      };
    });
    
    // Fonction optimisée pour retirer les classes actives
    const removeActiveClasses = () => {
      // Utilisation de forEach une seule fois pour chaque type d'élément
      sliderElements.buttons.forEach(btn => {
        btn.classList.remove("active");
        const text = btn.querySelector(".nav-button-text");
        if (text) text.classList.remove("active");
        const img = btn.querySelector(".nav-button-img");
        if (img) img.classList.remove("active");
      });
      
      sliderElements.videos.forEach(video => {
        video.classList.remove("active");
        video.currentTime = 0;
      });
      
      sliderElements.titles.forEach(title => title.classList.remove("active"));
      sliderElements.slides.forEach(slide => slide.classList.remove("active"));
      
      // Les éléments spécifiques "explorer"
      if (sliderElements.navExplorer) {
        sliderElements.navExplorer.classList.remove("active");
      }
    };
    
    // Utilisation de la délégation d'événements pour réduire le nombre d'écouteurs
    slider.addEventListener("click", (event) => {
      // Trouver le bouton le plus proche du clic (si existe)
      const btn = event.target.closest(".nav-button");
      if (!btn || !sliderElements.buttons.includes(btn) || btn.classList.contains("active")) return;
      
      // Opérations DOM regroupées pour minimiser les reflows
      requestAnimationFrame(() => {
        // Reset current state
        removeActiveClasses();
        
        // Get elements for this button
        const id = btn.id;
        const elements = elementsById[id];
        
        // Apply active classes efficiently
        btn.classList.add("active");
        if (elements.text) elements.text.classList.add("active");
        if (elements.img) elements.img.classList.add("active");
        if (elements.video) elements.video.classList.add("active");
        if (elements.title) elements.title.classList.add("active");
        if (elements.slide) elements.slide.classList.add("active");
        
        // Handle special cases for "explorer" and related buttons
        if (id === "explorer" && sliderElements.subSlider) {
          sliderElements.subSlider.classList.add("active");
          
          // Activer le cas "ciel" par défaut
          const cielElements = elementsById["ciel"];
          if (cielElements) {
            if (cielElements.video) cielElements.video.classList.add("active");
            if (cielElements.title) cielElements.title.classList.add("active");
            if (cielElements.button) cielElements.button.classList.add("active");
          }
          
          if (sliderElements.navExplorer) {
            sliderElements.navExplorer.classList.add("active");
          }
        }
        
        // Handle sub-navigation cases
        if (["ciel", "terre", "profondeur"].includes(id)) {
          if (sliderElements.navExplorer) {
            sliderElements.navExplorer.classList.add("active");
          }
          
          const explorerElements = elementsById["explorer"];
          if (explorerElements) {
            explorerElements.button.classList.add("active");
            if (explorerElements.text) explorerElements.text.classList.add("active");
            if (explorerElements.img) explorerElements.img.classList.add("active");
          }
        }
      });
    }, { passive: true }); // Marqué comme passif pour améliorer les performances tactiles
  });
};

// Initialisation déférée pour ne pas bloquer le chargement initial
const initializeWhenReady = () => {
  if (document.readyState === 'loading') {
    // Si le DOM n'est pas encore prêt, attendre l'événement DOMContentLoaded
    document.addEventListener("DOMContentLoaded", sliderInteraction, { once: true });
  } else {
    // Si le DOM est déjà prêt, exécuter immédiatement
    sliderInteraction();
  }
};

// Démarrer l'initialisation de manière optimisée
initializeWhenReady();

// pas oublier le défilement automatique des sliders
