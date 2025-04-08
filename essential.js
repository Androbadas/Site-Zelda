// Effet de parallaxe - Version essentielle pour le rendu initial
// Configuration simplifiée pour le chargement rapide

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
    }
  };
  
  // État minimal pour l'interactivité de base
  const state = {
    mouseX: 0, 
    mouseY: 0,
    currentX: 0, 
    currentY: 0,
    animationFrameId: null,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    backgroundElements: [],
    characterElements: []
  };
  
  // Utilisation d'une fonction pour mettre en cache les éléments DOM essentiels
  function cacheElements() {
    state.backgroundElements = config.background.elements.map(id => document.getElementById(id)).filter(Boolean);
    state.characterElements = config.character.elements.map(id => document.getElementById(id)).filter(Boolean);
  }
  
  // Détection de mobile - optimisée pour n'être exécutée qu'une seule fois
  const isMobileDevice = (function() {
    const check = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return () => check;
  })();
  
  // Fonction throttle essentielle
  function throttle(callback, delay) {
    let lastTime = 0;
    return function() {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        callback.apply(this, arguments);
      }
    };
  }
  
  // Configurer les transitions CSS des éléments
  function setupElements() {
    [...state.backgroundElements, ...state.characterElements].forEach(element => {
      if (element && !element.dataset.parallaxSetup) {
        element.style.transition = "transform 200ms cubic-bezier(0.33, 1, 0.68, 1), filter 300ms ease-out";
        element.dataset.parallaxSetup = "true";
      }
    });
  }
  
  // Gestionnaire d'événements essentiel pour la souris
  const updateMousePosition = throttle(function(event) {
    state.mouseX = event.clientX;
    state.mouseY = event.clientY;
    
    // Démarrer l'animation si elle n'est pas déjà en cours
    if (!state.animationFrameId) {
      state.animationFrameId = requestAnimationFrame(updateParallax);
    }
  }, 16); // Limite à environ 60 FPS
  
  // Version simplifiée de l'effet parallaxe
  function updateParallax() {
    // Appliquer un lissage à la position actuelle
    state.currentX += (state.mouseX - state.currentX) * 0.1;
    state.currentY += (state.mouseY - state.currentY) * 0.1;
    
    // Mettre à jour les éléments de personnage
    state.characterElements.forEach(element => {
      if (!element) return;
      
      // Appliquer le parallaxe
      const offsetX = (state.currentX - state.windowWidth / config.character.centerDivisorX) * config.character.moveFactorX;
      const offsetY = (state.currentY - state.windowHeight / config.character.centerDivisorY) * config.character.moveFactorY;
      
      element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    
    // Mettre à jour les éléments d'arrière-plan
    state.backgroundElements.forEach(element => {
      if (!element) return;
      
      const offsetX = (state.currentX - state.windowWidth / config.background.centerDivisorX) * config.background.moveFactorX;
      const offsetY = (state.currentY - state.windowHeight / config.background.centerDivisorY) * config.background.moveFactorY;
      
      element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    });
    
    // Continuer l'animation
    state.animationFrameId = requestAnimationFrame(updateParallax);
  }
  
  // SliderInteraction - Version essentielle
  const sliderInteraction = () => {
    // Cache des sélecteurs DOM fréquemment utilisés
    const sliders = document.querySelectorAll(".slider");
    if (!sliders.length) return;
    
    // Utiliser un Map pour conserver les références aux éléments actifs
    const activeElements = new Map();
    
    // Préparation et mise en cache des éléments pour chaque slider
    sliders.forEach(slider => {
      // Mise en cache des éléments
      const sliderElements = {
        buttons: Array.from(slider.querySelectorAll(".nav-button")),
        videos: Array.from(slider.querySelectorAll(".video-slide")),
        titles: Array.from(slider.querySelectorAll(".title-slide")),
        slides: Array.from(slider.querySelectorAll(".slide")),
        navExplorer: document.querySelector(".nav-explorer"),
        subSlider: document.querySelector(".sub-slider")
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
      
      // Fonction pour retirer les classes actives
      const removeActiveClasses = () => {
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
        
        if (sliderElements.navExplorer) {
          sliderElements.navExplorer.classList.remove("active");
        }
      };
      
      // Délégation d'événements pour les clics
      slider.addEventListener("click", (event) => {
        const btn = event.target.closest(".nav-button");
        if (!btn || !sliderElements.buttons.includes(btn) || btn.classList.contains("active")) return;
        
        requestAnimationFrame(() => {
          // Reset current state
          removeActiveClasses();
          
          // Get elements for this button
          const id = btn.id;
          const elements = elementsById[id];
          
          // Apply active classes
          btn.classList.add("active");
          if (elements.text) elements.text.classList.add("active");
          if (elements.img) elements.img.classList.add("active");
          if (elements.video) elements.video.classList.add("active");
          if (elements.title) elements.title.classList.add("active");
          if (elements.slide) elements.slide.classList.add("active");
          
          // Cas particulier "explorer"
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
          
          // Cas de sous-navigation
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
      }, { passive: true });
    });
  };
  
  // Initialisation minimale
  function init() {
    // Mise en cache des éléments DOM
    cacheElements();
    
    // Configuration des transitions
    setupElements();
    
    // Écouter les événements de la souris
    document.addEventListener("mousemove", updateMousePosition, { passive: true });
    
    // Démarrer l'animation
    state.animationFrameId = requestAnimationFrame(updateParallax);
    
    // Initialiser les sliders
    sliderInteraction();
    
    // Signaler que le chargement initial est terminé
    if (window.loadEnhancedFeatures) {
      window.loadEnhancedFeatures();
    }
  }
  
  // Initialiser après le chargement du DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }