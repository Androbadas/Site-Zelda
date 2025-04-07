// Effet de paralax
// Configuration des éléments parallaxe

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
    maxBlur: 5 // Flou maximum en pixels
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
    blurEnabled: false, // Désactivé pour l'arrière-plan par défaut
    maxBlur: 0.5
  },
  // Configuration pour le gyroscope
  gyroscope: {
    enabled: true,
    sensitivityX: 10, // Sensibilité de l'axe X (beta - inclinaison avant/arrière)
    sensitivityY: 100, // Sensibilité de l'axe Y (gamma - inclinaison gauche/droite)
    maxAngleX: 25,    // Angle maximum en degrés pour l'axe X
    maxAngleY: 25,    // Angle maximum en degrés pour l'axe Y
    smoothingFactor: 0.2, // Facteur de lissage pour les mouvements du gyroscope
    throttleRate: 30  // Taux de rafraîchissement en millisecondes (30ms)
  }
};

// Variables pour stocker les positions actuelles et cibles
let mouseX = 0, mouseY = 0;
let gyroX = 0, gyroY = 0;
let currentX = 0, currentY = 0;
let animationFrameId = null;
let edgeThreshold = 0.2; // Seuil pour déterminer la proximité au bord (0.2 = 20% de la largeur/hauteur)
let isUsingGyro = false; // Pour savoir si on utilise le gyroscope ou la souris

// Ajout des variables pour la position initiale du gyroscope
let initialGyroX = null;
let initialGyroY = null;
let gyroInitialized = false;

// Variable pour le throttling du gyroscope
let lastGyroUpdateTime = 0;

// Ajouter des transitions CSS aux éléments
function setupElements() {
  // Combiner tous les éléments
  const allElements = [...config.character.elements, ...config.background.elements];
  
  allElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) {
      // Ajouter des transitions pour transform et filter
      element.style.transition = "transform 200ms cubic-bezier(0.33, 1, 0.68, 1), filter 300ms ease-out";
    }
  });
}

// Calculer la proximité au bord (0 = centre, 1 = bord)
function calculateEdgeProximity(x, y, width, height) {
  // Normaliser les coordonnées entre 0 et 1
  const normalizedX = x / width;
  const normalizedY = y / height;
  
  // Calculer la distance au centre (0.5, 0.5)
  const distanceX = Math.abs(normalizedX - 0.5) * 2; // 0 au centre, 1 au bord
  const distanceY = Math.abs(normalizedY - 0.5) * 2;
  
  // Retourner la proximité au bord et la direction
  return {
    proximity: Math.max(distanceX, distanceY),
    direction: {
      x: normalizedX < 0.5 ? 1 : -1, // Direction du flou (opposée à la souris)
      y: normalizedY < 0.5 ? 1 : -1
    }
  };
}

// Mettre à jour la position de la souris
function updateMousePosition(event) {
  isUsingGyro = false; // Priorité à la souris si les deux sont utilisés
  mouseX = event.clientX;
  mouseY = event.clientY;
  
  // Démarrer l'animation si elle n'est pas déjà en cours
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(updateParallax);
  }
}

// Fonction de throttling pour limiter la fréquence des appels
function throttle(callback, delay) {
  const now = Date.now();
  if (now - lastGyroUpdateTime >= delay) {
    lastGyroUpdateTime = now;
    callback();
  }
}

// Gérer les données du gyroscope
function handleGyroscope(event) {
  if (!config.gyroscope.enabled) return;
  
  // Utiliser le throttling pour limiter la fréquence des mises à jour
  throttle(() => {
    // Ne traiter que les événements du gyroscope si nous n'utilisons pas la souris
    // Ou si nous sommes sur mobile (pas de souris)
    if (isMobileDevice() || !hasMouseMoved) {
      isUsingGyro = true;
      
      // Limiter les angles aux valeurs configurées
      const betaAngle = Math.max(-config.gyroscope.maxAngleX, Math.min(config.gyroscope.maxAngleX, event.beta));
      const gammaAngle = Math.max(-config.gyroscope.maxAngleY, Math.min(config.gyroscope.maxAngleY, event.gamma));
      
      // Enregistrer la position initiale au premier événement après validation
      if (!gyroInitialized && initialGyroX === null && initialGyroY === null) {
        initialGyroX = gammaAngle;
        initialGyroY = betaAngle;
        gyroInitialized = true;
        console.log("Position initiale du gyroscope enregistrée:", initialGyroX, initialGyroY);
      }
      
      // Convertir les angles en position relative à l'écran
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculer le delta par rapport à la position initiale
      const deltaY = betaAngle - initialGyroY;
      const deltaX = gammaAngle - initialGyroX;
      
      // Convertir ces deltas en coordonnées d'écran
      gyroY = ((deltaY + config.gyroscope.maxAngleX) / (2 * config.gyroscope.maxAngleX)) * windowHeight;
      gyroX = ((deltaX + config.gyroscope.maxAngleY) / (2 * config.gyroscope.maxAngleY)) * windowWidth;
      
      // Démarrer l'animation si elle n'est pas déjà en cours
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(updateParallax);
      }
    }
  }, config.gyroscope.throttleRate);
}

// Détecter si l'appareil est mobile
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Variable pour suivre si la souris a bougé
let hasMouseMoved = false;

// Mettre à jour l'effet de parallaxe avec lissage et flou directionnel
function updateParallax() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Utiliser soit la position de la souris, soit celle du gyroscope
  const targetX = isUsingGyro ? gyroX : mouseX;
  const targetY = isUsingGyro ? gyroY : mouseY;
  
  // Appliquer un lissage différent selon la source d'entrée
  const smoothing = isUsingGyro ? config.gyroscope.smoothingFactor : 0.1;
  
  // Appliquer un lissage à la position actuelle
  currentX += (targetX - currentX) * smoothing;
  currentY += (targetY - currentY) * smoothing;
  
  // Calculer la proximité au bord et la direction
  const edge = calculateEdgeProximity(currentX, currentY, windowWidth, windowHeight);
  
  // N'appliquer le flou que lorsque la souris est proche du bord
  const edgeEffect = edge.proximity > edgeThreshold ? 
    (edge.proximity - edgeThreshold) / (1 - edgeThreshold) : 0;
  
  // Mettre à jour les éléments de personnage
  config.character.elements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Appliquer le parallaxe
    const offsetX = (currentX - windowWidth / config.character.centerDivisorX) * config.character.moveFactorX;
    const offsetY = (currentY - windowHeight / config.character.centerDivisorY) * config.character.moveFactorY;
    
    element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    // Appliquer le flou directionnel si activé
    if (config.character.blurEnabled && edgeEffect > 0) {
      // Calculer l'intensité du flou
      const blurAmount = edgeEffect * config.character.maxBlur;
      
      // Appliquer un flou directionnel (du côté opposé à la souris)
      // Nous utilisons un flou standard car le flou directionnel CSS n'est pas bien supporté
      element.style.filter = `blur(${blurAmount}px)`;
    } else {
      element.style.filter = 'none';
    }
  });
  
  // Mettre à jour les éléments d'arrière-plan
  config.background.elements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const offsetX = (currentX - windowWidth / config.background.centerDivisorX) * config.background.moveFactorX;
    const offsetY = (currentY - windowHeight / config.background.centerDivisorY) * config.background.moveFactorY;
    
    element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
    // Appliquer le flou directionnel si activé pour l'arrière-plan
    if (config.background.blurEnabled && edgeEffect > 0) {
      const blurAmount = edgeEffect * config.background.maxBlur;
      element.style.filter = `blur(${blurAmount}px)`;
    } else {
      element.style.filter = 'none';
    }
  });
  
  // Continuer l'animation
  animationFrameId = requestAnimationFrame(updateParallax);
}

// NOUVELLE FONCTION - Créer une popup adaptée au style Zelda TOTK uniquement pour mobile et tablette
function createPermissionUI() {
  // Si la popup existe déjà, ne pas la recréer
  if (document.getElementById('gyro-permission-popup')) return;
  
  // Vérifier si l'appareil est un mobile ou une tablette
  const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Ne créer la popup que si l'appareil est un mobile ou une tablette
  if (isMobileOrTablet) {
    // Créer l'élément de popup
    const popup = document.createElement('div');
    popup.id = 'gyro-permission-popup';
    
    // Créer le contenu de la popup
    popup.innerHTML = `
        <div class="popup-content">
            
            <h3>EFFET GYROSCOPIQUE</h3>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#FFFDE4" class="bi bi-phone-flip" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M11 1H5a1 1 0 0 0-1 1v6a.5.5 0 0 1-1 0V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a.5.5 0 0 1-1 0V2a1 1 0 0 0-1-1m1 13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a.5.5 0 0 0-1 0v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a.5.5 0 0 0-1 0zM1.713 7.954a.5.5 0 1 0-.419-.908c-.347.16-.654.348-.882.57C.184 7.842 0 8.139 0 8.5c0 .546.408.94.823 1.201.44.278 1.043.51 1.745.696C3.978 10.773 5.898 11 8 11q.148 0 .294-.002l-1.148 1.148a.5.5 0 0 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2a.5.5 0 1 0-.708.708l1.145 1.144L8 10c-2.04 0-3.87-.221-5.174-.569-.656-.175-1.151-.374-1.47-.575C1.012 8.639 1 8.506 1 8.5c0-.003 0-.059.112-.17.115-.112.31-.242.6-.376Zm12.993-.908a.5.5 0 0 0-.419.908c.292.134.486.264.6.377.113.11.113.166.113.169s0 .065-.13.187c-.132.122-.352.26-.677.4-.645.28-1.596.523-2.763.687a.5.5 0 0 0 .14.99c1.212-.17 2.26-.43 3.02-.758.38-.164.713-.357.96-.587.246-.229.45-.537.45-.919 0-.362-.184-.66-.412-.883s-.535-.411-.882-.571M7.5 2a.5.5 0 0 0 0 1h1a.5.5 0 0 0 0-1z"/>
            </svg>
            <p>Autorisez l'accès au gyroscope, pour une expérience immersive.</p>
            <button id="gyro-permission-btn" class="bouton-classique">AUTORISER</button>
            <button id="gyro-permission-btn-refuser">Refuser</button>
        </div>
    `;
    
    // Ajouter le popup au corps du document
    document.body.appendChild(popup);
    
    // Ajouter l'écouteur d'événement au bouton Autoriser
    document.getElementById('gyro-permission-btn').addEventListener('click', function() {
      requestGyroscopePermission();
      // Ajouter une classe pour faire disparaître la popup en douceur
      popup.classList.add('fade-out');
      // Supprimer la popup après l'animation
      setTimeout(() => {
          if (popup.parentNode) {
              document.body.removeChild(popup);
          }
      }, 500);
      const gyroBtn = document.querySelectorAll('.expandBtn');
      gyroBtn.forEach((btn) => {
        btn.classList.add('active');
      });
    });
    
    // Ajouter l'écouteur d'événement au bouton Refuser
    document.getElementById('gyro-permission-btn-refuser').addEventListener('click', function() {
        // Stocker dans localStorage que l'utilisateur a refusé
        localStorage.setItem('gyroscopePermissionRefused', 'true');
        
        // Ajouter une classe pour faire disparaître la popup en douceur
        popup.classList.add('fade-out');
        // Supprimer la popup après l'animation
        setTimeout(() => {
            if (popup.parentNode) {
                document.body.removeChild(popup);
            }
        }, 500);
    });
  }
}

// Vérifier si le gyroscope est disponible et demander l'autorisation
function requestGyroscopePermission() {
  // Réinitialiser les valeurs initiales lors d'une nouvelle demande d'autorisation
  initialGyroX = null;
  initialGyroY = null;
  gyroInitialized = false;
  
  if (window.DeviceOrientationEvent) {
    // Pour iOS 13+ qui nécessite une permission explicite
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleGyroscope);
            console.log("Autorisation du gyroscope accordée");
          } else {
            console.log("Autorisation du gyroscope refusée");
          }
        })
        .catch(error => {
          console.error("Erreur lors de la demande d'autorisation:", error);
        });
    } else {
      // Pour les autres navigateurs qui ne nécessitent pas de permission
      window.addEventListener('deviceorientation', handleGyroscope);
      console.log("Gyroscope activé sans besoin de permission");
    }
  } else {
    console.log("Le gyroscope n'est pas disponible sur cet appareil");
  }
}

// Initialisation
function init() {
  setupElements();
  
  // Initialiser la variable de temps pour le throttling
  lastGyroUpdateTime = Date.now();
  
  // Écouter les événements de la souris
  document.addEventListener("mousemove", (e) => {
    hasMouseMoved = true;
    updateMousePosition(e);
  });
  
  // Initialiser le gyroscope pour les appareils mobiles
  if (isMobileDevice()) {
    // Attendre un court instant pour que la page soit complètement chargée
    setTimeout(() => {
      createPermissionUI();
    }, 1000);
  } else {
    // Démarrer immédiatement l'animation sur les appareils non mobiles
    animationFrameId = requestAnimationFrame(updateParallax);
  }
  
  // Nettoyage lors du déchargement de la page
  window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    
    // Supprimer les écouteurs d'événements
    document.removeEventListener("mousemove", updateMousePosition);
    window.removeEventListener('deviceorientation', handleGyroscope);
  });
}

// Démarrer le parallaxe quand le DOM est entièrement chargé
document.addEventListener('DOMContentLoaded', init);

const expandBtn = document.querySelectorAll('.expandBtn');
expandBtn.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle('expanded');
  });
});





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


const sliderInteraction = () => {
// Récupère tous les sliders
const sliders = document.querySelectorAll(".slider");
if (!sliders.length) return;

sliders.forEach(slider => {
  // Récupère les boutons du slider en cours
  const buttons = slider.querySelectorAll(".nav-button");
  if (!buttons.length) return;

  // Fonction utilitaire pour retirer la classe "active" des éléments associés
  const removeActiveClasses = () => {
    buttons.forEach(btn => {
      btn.classList.remove("active");
      const text = btn.querySelector(".nav-button-text");
      const img = btn.querySelector(".nav-button-img");
      if (text) text.classList.remove("active");
      if (img) img.classList.remove("active");
      if (btn.id === "creez" || btn.id === "decouvrez") {
        document.querySelector(".nav-explorer").classList.remove("active");
      }
    });

    slider.querySelectorAll(".video-slide").forEach(video => {
      video.classList.remove("active");
      video.currentTime = 0;
    });
    slider.querySelectorAll(".title-slide").forEach(title => {
      title.classList.remove("active");
    });
    slider.querySelectorAll(".slide").forEach(slide => {
      slide.classList.remove("active");
    })
  };

  // Gestion des clics pour chaque bouton
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;

      // Retirer les classes "active" uniquement pour ce slider
      removeActiveClasses();

      // Ajouter les classes actives au bouton cliqué
      btn.classList.add("active");
      const text = btn.querySelector(".nav-button-text");
      const img = btn.querySelector(".nav-button-img");
      if (text) text.classList.add("active");
      if (img) img.classList.add("active");

      // Activer le bon slide
      const video = document.getElementById(`video-${btn.id}`);
      const title = document.getElementById(`title-${btn.id}`);
      const slide = document.getElementById(`slide-${btn.id}`);
      if (video) video.classList.add("active");
      if (title) title.classList.add("active");
      if (slide) slide.classList.add("active");

      if (btn.id === "explorer") {
        document.querySelector(".sub-slider").classList.add("active");
        document.getElementById("video-ciel").classList.add("active");
        document.getElementById("title-ciel").classList.add("active");
        document.getElementById("ciel").classList.add("active");
        document.querySelector(".nav-explorer").classList.add("active");
      }

      if (["ciel", "terre", "profondeur"].includes(btn.id)) {
        document.querySelector(".nav-explorer").classList.add("active");
        document.getElementById("explorer").classList.add("active");
        document.getElementById("explorer").querySelector(".nav-button-text").classList.add("active");
        document.getElementById("explorer").querySelector(".nav-button-img").classList.add("active");
      }
    });
  });
});
};


document.addEventListener("DOMContentLoaded", ()=>{
sliderInteraction();
});

// pas oublier le défilement automatique des sliders
