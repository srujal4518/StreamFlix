const bar = document.getElementById('bar');
  const nav = document.getElementById('navbar');
  const close = document.getElementById('close');

  if (bar) {
    bar.addEventListener('click', () => {
      nav.classList.add('active');
    });
  }

  if (close) {
    close.addEventListener('click', () => {
      nav.classList.remove('active');
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
  // Desktop slideshow
  const desktopSlides = document.querySelectorAll(".slide-desktop");
  let desktopIndex = 0;

  function showDesktopSlide(index) {
    desktopSlides.forEach((slide, i) => {
      slide.classList.remove("active");
      if (i === index) slide.classList.add("active");
    });
  }

  function nextDesktopSlide() {
    desktopIndex = (desktopIndex + 1) % desktopSlides.length;
    showDesktopSlide(desktopIndex);
  }

  // Mobile slideshow
  const mobileSlides = document.querySelectorAll(".slide-mobile");
  let mobileIndex = 0;

  function showMobileSlide(index) {
    mobileSlides.forEach((slide, i) => {
      slide.classList.remove("active");
      if (i === index) slide.classList.add("active");
    });
  }

  function nextMobileSlide() {
    mobileIndex = (mobileIndex + 1) % mobileSlides.length;
    showMobileSlide(mobileIndex);
  }

  // Init both (only one will be visible)
  showDesktopSlide(desktopIndex);
  setInterval(nextDesktopSlide, 2000);

  showMobileSlide(mobileIndex);
  setInterval(nextMobileSlide, 2000);
});
const swiper = new Swiper(".mySwiper", {
  slidesPerView: 5,
  spaceBetween: 15,
  loop: true,  // 👈 This enables infinite looping
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    320: { slidesPerView: 2 },
    480: { slidesPerView: 3 },
    768: { slidesPerView: 4 },
    1024: { slidesPerView: 5 }
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("trailer-section");
  const video = section.querySelector(".trailer-video");
  const poster = section.querySelector(".trailer-poster");

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Wait 5 seconds before playing the video
          setTimeout(() => {
            video.style.opacity = "1";
            poster.style.opacity = "0";
            video.play();
          }, 3000); // 5000 ms = 5 seconds

          observer.unobserve(section);
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(section);
});











