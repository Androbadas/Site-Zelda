
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
