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
    sensitivityX: 10,      // Sensibilité de l'axe X (beta - inclinaison avant/arrière)
    sensitivityY: 10,      // Sensibilité de l'axe Y (gamma - inclinaison gauche/droite)
    maxAngleX: 45,         // Angle maximum en degrés pour l'axe X
    maxAngleY: 45,         // Angle maximum en degrés pour l'axe Y
    smoothingFactor: 0.2,  // Facteur de lissage pour les mouvements du gyroscope
    referenceAngleBeta: 45, // Angle de référence "neutre" pour beta (position naturelle)
    referenceAngleGamma: 0  // Angle de référence "neutre" pour gamma
  }
};

// Variables pour stocker les positions actuelles et cibles
let mouseX = 0, mouseY = 0;
let gyroX = 0, gyroY = 0;
let currentX = window.innerWidth / 2, currentY = window.innerHeight / 2; // Position initiale au centre
let animationFrameId = null;
let edgeThreshold = 0.2; // Seuil pour déterminer la proximité au bord (0.2 = 20% de la largeur/hauteur)
let isUsingGyro = false; // Pour savoir si on utilise le gyroscope ou la souris

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

// Gérer les données du gyroscope
function handleGyroscope(event) {
  if (!config.gyroscope.enabled) return;
  
  // Ne traiter que les événements du gyroscope si nous n'utilisons pas la souris
  // Ou si nous sommes sur mobile (pas de souris)
  if (isMobileDevice() || !hasMouseMoved) {
    isUsingGyro = true;
    
    // Calculer la différence par rapport à l'angle de référence
    const betaDiff = event.beta - config.gyroscope.referenceAngleBeta;
    const gammaDiff = event.gamma - config.gyroscope.referenceAngleGamma;
    
    // Limiter les différences aux valeurs configurées
    const clampedBetaDiff = Math.max(-config.gyroscope.maxAngleX, Math.min(config.gyroscope.maxAngleX, betaDiff));
    const clampedGammaDiff = Math.max(-config.gyroscope.maxAngleY, Math.min(config.gyroscope.maxAngleY, gammaDiff));
    
    // Convertir les angles en position relative à l'écran
    // Beta contrôle l'axe Y (inclinaison avant/arrière)
    // Gamma contrôle l'axe X (inclinaison gauche/droite)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Normaliser les valeurs du gyroscope pour qu'elles correspondent à des coordonnées d'écran
    // Centrer quand l'appareil est à la position de référence
    gyroY = windowHeight / 2 + (clampedBetaDiff / config.gyroscope.maxAngleX) * (windowHeight / 2);
    gyroX = windowWidth / 2 + (clampedGammaDiff / config.gyroscope.maxAngleY) * (windowWidth / 2);
    
    // Démarrer l'animation si elle n'est pas déjà en cours
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(updateParallax);
    }
  }
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

// Vérifier si le gyroscope est disponible et demander l'autorisation
function checkGyroscopeAvailability() {
  if (window.DeviceOrientationEvent) {
    // Pour iOS 13+ qui nécessite une permission explicite
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Créer un bouton pour demander la permission
      const permissionButton = document.createElement('button');
      permissionButton.innerText = 'Activer le gyroscope';
      permissionButton.style.position = 'fixed';
      permissionButton.style.top = '10px';
      permissionButton.style.left = '10px';
      permissionButton.style.zIndex = '1000';
      permissionButton.style.padding = '10px';
      permissionButton.style.backgroundColor = '#3498db';
      permissionButton.style.color = 'white';
      permissionButton.style.border = 'none';
      permissionButton.style.borderRadius = '5px';
      permissionButton.style.cursor = 'pointer';
      
      permissionButton.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleGyroscope);
              document.body.removeChild(permissionButton);
            }
          })
          .catch(console.error);
      });
      
      document.body.appendChild(permissionButton);
    } else {
      // Pour les autres navigateurs qui ne nécessitent pas de permission
      window.addEventListener('deviceorientation', handleGyroscope);
    }
  }
}

// Calibrer les angles de référence du gyroscope
function calibrateGyroscope() {
  // Ne créer le bouton que sur les appareils mobiles
  if (isMobileDevice() && config.gyroscope.enabled) {
    const calibrateButton = document.createElement('button');
    calibrateButton.innerText = 'Calibrer le gyroscope';
    calibrateButton.style.position = 'fixed';
    calibrateButton.style.bottom = '10px';
    calibrateButton.style.right = '10px';
    calibrateButton.style.zIndex = '1000';
    calibrateButton.style.padding = '10px';
    calibrateButton.style.backgroundColor = '#2ecc71';
    calibrateButton.style.color = 'white';
    calibrateButton.style.border = 'none';
    calibrateButton.style.borderRadius = '5px';
    calibrateButton.style.cursor = 'pointer';
    
    calibrateButton.addEventListener('click', () => {
      // Attacher un écouteur d'événement ponctuel pour lire les valeurs actuelles
      const calibrationHandler = (event) => {
        // Définir les angles actuels comme références
        config.gyroscope.referenceAngleBeta = event.beta;
        config.gyroscope.referenceAngleGamma = event.gamma;
        
        // Afficher un message de confirmation
        const confirmationMsg = document.createElement('div');
        confirmationMsg.innerText = 'Calibration réussie!';
        confirmationMsg.style.position = 'fixed';
        confirmationMsg.style.top = '50%';
        confirmationMsg.style.left = '50%';
        confirmationMsg.style.transform = 'translate(-50%, -50%)';
        confirmationMsg.style.backgroundColor = 'rgba(46, 204, 113, 0.8)';
        confirmationMsg.style.color = 'white';
        confirmationMsg.style.padding = '20px';
        confirmationMsg.style.borderRadius = '10px';
        confirmationMsg.style.zIndex = '2000';
        
        document.body.appendChild(confirmationMsg);
        
        // Supprimer le message après 2 secondes
        setTimeout(() => {
          document.body.removeChild(confirmationMsg);
        }, 2000);
        
        // Supprimer l'écouteur après usage
        window.removeEventListener('deviceorientation', calibrationHandler);
      };
      
      window.addEventListener('deviceorientation', calibrationHandler, { once: true });
    });
    
    document.body.appendChild(calibrateButton);
  }
}

// Initialisation
function init() {
  setupElements();
  
  // Écouter les événements de la souris
  document.addEventListener("mousemove", (e) => {
    hasMouseMoved = true;
    updateMousePosition(e);
  });
  
  // Initialiser le gyroscope pour les appareils mobiles
  if (isMobileDevice()) {
    checkGyroscopeAvailability();
    // Ajouter le bouton de calibration après l'initialisation du gyroscope
    calibrateGyroscope();
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

// Démarrer le parallaxe
init();




// const config = {
//   background: {
//     elements: [
//       "background-paralax", "paralax-zelda-background", "paralax-link-character-background", "paralax-ganondorf-background"
//     ],
//     moveFactorX: 0.03,
//     moveFactorY: 0,
//     centerDivisorX: 3,
//     centerDivisorY: 3,
//     smoothingFactor: 0.1,
//     blurEnabled: true,
//     maxBlur: 5 // Flou maximum en pixels
//   },
//   character: {
//     elements: [
//       "link-paralax", "paralax-zelda-character", "paralax-link-character", "paralax-ganondorf-character"
//     ],
//     moveFactorX: 0.015,
//     moveFactorY: 0,
//     centerDivisorX: 2,
//     centerDivisorY: 2,
//     smoothingFactor: 0.05,
//     blurEnabled: false, // Désactivé pour l'arrière-plan par défaut
//     maxBlur: 0.5
//   },
//   // Configuration pour le gyroscope
//   gyroscope: {
//     enabled: true,
//     sensitivityX: 10, // Sensibilité de l'axe X (beta - inclinaison avant/arrière)
//     sensitivityY: 50, // Sensibilité de l'axe Y (gamma - inclinaison gauche/droite)
//     maxAngleX: 45,    // Angle maximum en degrés pour l'axe X
//     maxAngleY: 45,    // Angle maximum en degrés pour l'axe Y
//     smoothingFactor: 0.2 // Facteur de lissage pour les mouvements du gyroscope
//   }
// };

// // Variables pour stocker les positions actuelles et cibles
// let mouseX = 0, mouseY = 0;
// let gyroX = 0, gyroY = 0;
// let currentX = 45, currentY = 0;
// let animationFrameId = null;
// let edgeThreshold = 0.2; // Seuil pour déterminer la proximité au bord (0.2 = 20% de la largeur/hauteur)
// let isUsingGyro = false; // Pour savoir si on utilise le gyroscope ou la souris

// // Ajouter des transitions CSS aux éléments
// function setupElements() {
//   // Combiner tous les éléments
//   const allElements = [...config.character.elements, ...config.background.elements];
  
//   allElements.forEach(elementId => {
//     const element = document.getElementById(elementId);
//     if (element) {
//       // Ajouter des transitions pour transform et filter
//       element.style.transition = "transform 200ms cubic-bezier(0.33, 1, 0.68, 1), filter 300ms ease-out";
//     }
//   });
// }

// // Calculer la proximité au bord (0 = centre, 1 = bord)
// function calculateEdgeProximity(x, y, width, height) {
//   // Normaliser les coordonnées entre 0 et 1
//   const normalizedX = x / width;
//   const normalizedY = y / height;
  
//   // Calculer la distance au centre (0.5, 0.5)
//   const distanceX = Math.abs(normalizedX - 0.5) * 2; // 0 au centre, 1 au bord
//   const distanceY = Math.abs(normalizedY - 0.5) * 2;
  
//   // Retourner la proximité au bord et la direction
//   return {
//     proximity: Math.max(distanceX, distanceY),
//     direction: {
//       x: normalizedX < 0.5 ? 1 : -1, // Direction du flou (opposée à la souris)
//       y: normalizedY < 0.5 ? 1 : -1
//     }
//   };
// }

// // Mettre à jour la position de la souris
// function updateMousePosition(event) {
//   isUsingGyro = false; // Priorité à la souris si les deux sont utilisés
//   mouseX = event.clientX;
//   mouseY = event.clientY;
  
//   // Démarrer l'animation si elle n'est pas déjà en cours
//   if (!animationFrameId) {
//     animationFrameId = requestAnimationFrame(updateParallax);
//   }
// }

// // Gérer les données du gyroscope
// function handleGyroscope(event) {
//   if (!config.gyroscope.enabled) return;
  
//   // Ne traiter que les événements du gyroscope si nous n'utilisons pas la souris
//   // Ou si nous sommes sur mobile (pas de souris)
//   if (isMobileDevice() || !hasMouseMoved) {
//     isUsingGyro = true;
    
//     // Limiter les angles aux valeurs configurées
//     const betaAngle = Math.max(-config.gyroscope.maxAngleX, Math.min(config.gyroscope.maxAngleX, event.beta));
//     const gammaAngle = Math.max(-config.gyroscope.maxAngleY, Math.min(config.gyroscope.maxAngleY, event.gamma));
    
//     // Convertir les angles en position relative à l'écran
//     // Beta contrôle l'axe Y (inclinaison avant/arrière)
//     // Gamma contrôle l'axe X (inclinaison gauche/droite)
//     const windowWidth = window.innerWidth;
//     const windowHeight = window.innerHeight;
    
//     // Normaliser les valeurs du gyroscope pour qu'elles correspondent à des coordonnées d'écran
//     gyroY = ((betaAngle + config.gyroscope.maxAngleX) / (2 * config.gyroscope.maxAngleX)) * windowHeight;
//     gyroX = ((gammaAngle + config.gyroscope.maxAngleY) / (2 * config.gyroscope.maxAngleY)) * windowWidth;
    
//     // Démarrer l'animation si elle n'est pas déjà en cours
//     if (!animationFrameId) {
//       animationFrameId = requestAnimationFrame(updateParallax);
//     }
//   }
// }

// // Détecter si l'appareil est mobile
// function isMobileDevice() {
//   return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// }

// // Variable pour suivre si la souris a bougé
// let hasMouseMoved = false;

// // Mettre à jour l'effet de parallaxe avec lissage et flou directionnel
// function updateParallax() {
//   const windowWidth = window.innerWidth;
//   const windowHeight = window.innerHeight;
  
//   // Utiliser soit la position de la souris, soit celle du gyroscope
//   const targetX = isUsingGyro ? gyroX : mouseX;
//   const targetY = isUsingGyro ? gyroY : mouseY;
  
//   // Appliquer un lissage différent selon la source d'entrée
//   const smoothing = isUsingGyro ? config.gyroscope.smoothingFactor : 0.1;
  
//   // Appliquer un lissage à la position actuelle
//   currentX += (targetX - currentX) * smoothing;
//   currentY += (targetY - currentY) * smoothing;
  
//   // Calculer la proximité au bord et la direction
//   const edge = calculateEdgeProximity(currentX, currentY, windowWidth, windowHeight);
  
//   // N'appliquer le flou que lorsque la souris est proche du bord
//   const edgeEffect = edge.proximity > edgeThreshold ? 
//     (edge.proximity - edgeThreshold) / (1 - edgeThreshold) : 0;
  
//   // Mettre à jour les éléments de personnage
//   config.character.elements.forEach(elementId => {
//     const element = document.getElementById(elementId);
//     if (!element) return;
    
//     // Appliquer le parallaxe
//     const offsetX = (currentX - windowWidth / config.character.centerDivisorX) * config.character.moveFactorX;
//     const offsetY = (currentY - windowHeight / config.character.centerDivisorY) * config.character.moveFactorY;
    
//     element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
//     // Appliquer le flou directionnel si activé
//     if (config.character.blurEnabled && edgeEffect > 0) {
//       // Calculer l'intensité du flou
//       const blurAmount = edgeEffect * config.character.maxBlur;
      
//       // Appliquer un flou directionnel (du côté opposé à la souris)
//       // Nous utilisons un flou standard car le flou directionnel CSS n'est pas bien supporté
//       element.style.filter = `blur(${blurAmount}px)`;
//     } else {
//       element.style.filter = 'none';
//     }
//   });
  
//   // Mettre à jour les éléments d'arrière-plan
//   config.background.elements.forEach(elementId => {
//     const element = document.getElementById(elementId);
//     if (!element) return;
    
//     const offsetX = (currentX - windowWidth / config.background.centerDivisorX) * config.background.moveFactorX;
//     const offsetY = (currentY - windowHeight / config.background.centerDivisorY) * config.background.moveFactorY;
    
//     element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    
//     // Appliquer le flou directionnel si activé pour l'arrière-plan
//     if (config.background.blurEnabled && edgeEffect > 0) {
//       const blurAmount = edgeEffect * config.background.maxBlur;
//       element.style.filter = `blur(${blurAmount}px)`;
//     } else {
//       element.style.filter = 'none';
//     }
//   });
  
//   // Continuer l'animation
//   animationFrameId = requestAnimationFrame(updateParallax);
// }

// // Vérifier si le gyroscope est disponible et demander l'autorisation
// function checkGyroscopeAvailability() {
//   if (window.DeviceOrientationEvent) {
//     // Pour iOS 13+ qui nécessite une permission explicite
//     if (typeof DeviceOrientationEvent.requestPermission === 'function') {
//       // Créer un bouton pour demander la permission
//       const permissionButton = document.createElement('button');
//       permissionButton.innerText = 'Activer le gyroscope';
//       permissionButton.style.position = 'fixed';
//       permissionButton.style.top = '10px';
//       permissionButton.style.left = '10px';
//       permissionButton.style.zIndex = '1000';
//       permissionButton.style.padding = '10px';
//       permissionButton.style.backgroundColor = '#3498db';
//       permissionButton.style.color = 'white';
//       permissionButton.style.border = 'none';
//       permissionButton.style.borderRadius = '5px';
//       permissionButton.style.cursor = 'pointer';
      
//       permissionButton.addEventListener('click', () => {
//         DeviceOrientationEvent.requestPermission()
//           .then(response => {
//             if (response === 'granted') {
//               window.addEventListener('deviceorientation', handleGyroscope);
//               document.body.removeChild(permissionButton);
//             }
//           })
//           .catch(console.error);
//       });
      
//       document.body.appendChild(permissionButton);
//     } else {
//       // Pour les autres navigateurs qui ne nécessitent pas de permission
//       window.addEventListener('deviceorientation', handleGyroscope);
//     }
//   }
// }

// // Initialisation
// function init() {
//   setupElements();
  
//   // Écouter les événements de la souris
//   document.addEventListener("mousemove", (e) => {
//     hasMouseMoved = true;
//     updateMousePosition(e);
//   });
  
//   // Initialiser le gyroscope pour les appareils mobiles
//   if (isMobileDevice()) {
//     checkGyroscopeAvailability();
//   }
  
//   // Nettoyage lors du déchargement de la page
//   window.addEventListener("beforeunload", () => {
//     if (animationFrameId) {
//       cancelAnimationFrame(animationFrameId);
//     }
    
//     // Supprimer les écouteurs d'événements
//     document.removeEventListener("mousemove", updateMousePosition);
//     window.removeEventListener('deviceorientation', handleGyroscope);
//   });
// }

// // Démarrer le parallaxe
// init();










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




