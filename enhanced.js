// Effet de parallaxe - Fonctionnalités avancées
// Chargées après le rendu initial pour ne pas bloquer l'interactivité

// Configuration étendue pour les fonctionnalités avancées
const enhancedConfig = {
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
  
  // État étendu pour les fonctionnalités avancées
  const enhancedState = {
    gyroX: 0, 
    gyroY: 0,
    edgeThreshold: 0.2,
    isUsingGyro: false,
    initialGyroX: null,
    initialGyroY: null,
    gyroInitialized: false,
    lastGyroUpdateTime: 0,
    hasMouseMoved: false
  };
  
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
  
  // Gestionnaire de gyroscope optimisé
  const handleGyroscope = throttle(function(event) {
    if (!enhancedConfig.gyroscope.enabled) return;
    
    // Ne traiter que les événements du gyroscope si approprié
    if (isMobileDevice() || !enhancedState.hasMouseMoved) {
      enhancedState.isUsingGyro = true;
      
      // Limiter les angles aux valeurs configurées
      const betaAngle = Math.max(-enhancedConfig.gyroscope.maxAngleX, 
                      Math.min(enhancedConfig.gyroscope.maxAngleX, event.beta));
      const gammaAngle = Math.max(-enhancedConfig.gyroscope.maxAngleY, 
                       Math.min(enhancedConfig.gyroscope.maxAngleY, event.gamma));
      
      // Enregistrer la position initiale au premier événement
      if (!enhancedState.gyroInitialized && enhancedState.initialGyroX === null && enhancedState.initialGyroY === null) {
        enhancedState.initialGyroX = gammaAngle;
        enhancedState.initialGyroY = betaAngle;
        enhancedState.gyroInitialized = true;
      }
      
      // Calculer le delta par rapport à la position initiale
      const deltaY = betaAngle - enhancedState.initialGyroY;
      const deltaX = gammaAngle - enhancedState.initialGyroX;
      
      // Convertir ces deltas en coordonnées d'écran
      enhancedState.gyroY = ((deltaY + enhancedConfig.gyroscope.maxAngleX) / 
                          (2 * enhancedConfig.gyroscope.maxAngleX)) * state.windowHeight;
      enhancedState.gyroX = ((deltaX + enhancedConfig.gyroscope.maxAngleY) / 
                          (2 * enhancedConfig.gyroscope.maxAngleY)) * state.windowWidth;
      
      // Affecter les positions gyro à mouseX et mouseY
      state.mouseX = enhancedState.gyroX;
      state.mouseY = enhancedState.gyroY;
      
      // Démarrer l'animation si nécessaire
      if (!state.animationFrameId) {
        state.animationFrameId = requestAnimationFrame(updateEnhancedParallax);
      }
    }
  }, enhancedConfig.gyroscope.throttleRate);
  
  // Version améliorée de l'effet parallaxe
  function updateEnhancedParallax() {
    // Utiliser soit la position de la souris, soit celle du gyroscope
    const targetX = enhancedState.isUsingGyro ? enhancedState.gyroX : state.mouseX;
    const targetY = enhancedState.isUsingGyro ? enhancedState.gyroY : state.mouseY;
    
    // Appliquer un lissage différent selon la source d'entrée
    const smoothing = enhancedState.isUsingGyro ? enhancedConfig.gyroscope.smoothingFactor : 0.1;
    
    // Appliquer un lissage à la position actuelle
    state.currentX += (targetX - state.currentX) * smoothing;
    state.currentY += (targetY - state.currentY) * smoothing;
    
    // Calculer la proximité au bord
    const edge = calculateEdgeProximity();
    
    // N'appliquer le flou que lorsque la souris est proche du bord
    const edgeEffect = edge.proximity > enhancedState.edgeThreshold ? 
      (edge.proximity - enhancedState.edgeThreshold) / (1 - enhancedState.edgeThreshold) : 0;
  
    // Mettre à jour les éléments de personnage
    state.characterElements.forEach(element => {
      if (!element) return;
      
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
      if (!element) return;
      
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
    state.animationFrameId = requestAnimationFrame(updateEnhancedParallax);
  }
  
  // Créer UI de permission gyroscope avec lazy loading
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
    
    // Ajouter les écouteurs d'événements
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
      }, { once: true });
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
    enhancedState.initialGyroX = null;
    enhancedState.initialGyroY = null;
    enhancedState.gyroInitialized = false;
    
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
  
  // Gestion du redimensionnement de la fenêtre
  const handleResize = throttle(function() {
    state.windowWidth = window.innerWidth;
    state.windowHeight = window.innerHeight;
  }, 250);
  
  // Initialisation des fonctionnalités avancées
  function initEnhanced() {
    console.log("Chargement des fonctionnalités avancées...");
    
    // Mise à jour des gestionnaires d'événements
    document.addEventListener("mousemove", function(e) {
      enhancedState.hasMouseMoved = true;
      enhancedState.isUsingGyro = false;
    }, { passive: true, once: true });
    
    // Remplacer la fonction updateParallax par updateEnhancedParallax
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = requestAnimationFrame(updateEnhancedParallax);
    }
    
    // Écouter les événements de redimensionnement
    window.addEventListener("resize", handleResize, { passive: true });
    
    // Initialiser le gyroscope si sur mobile
    if (isMobileDevice()) {
      // Vérifier si la permission a déjà été refusée
      if (localStorage.getItem('gyroscopePermissionRefused') !== 'true') {
        setTimeout(createPermissionUI, 1000);
      }
    }
    
    // Initialiser les boutons expand avec fonctionnalités complètes
    document.querySelectorAll('.expandBtn').forEach(btn => {
      // Supprimer les anciens écouteurs s'ils existent
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Ajouter le nouvel écouteur avec fonctionnalités complètes
      newBtn.addEventListener("click", function() {
        this.classList.toggle('expanded');
        
        // Animation supplémentaire si nécessaire
        const content = this.nextElementSibling;
        if (content && content.classList.contains('expandable-content')) {
          if (this.classList.contains('expanded')) {
            content.style.maxHeight = content.scrollHeight + "px";
          } else {
            content.style.maxHeight = "0";
          }
        }
      }, { passive: true });
    });
    
    // Nettoyer les ressources à la fermeture
    window.addEventListener("beforeunload", cleanup);
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
  
  // Exposer la fonction d'initialisation des fonctionnalités avancées
  window.loadEnhancedFeatures = initEnhanced;
  
  // Si le document est déjà chargé, initialiser les fonctionnalités avancées
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEnhanced();
  }