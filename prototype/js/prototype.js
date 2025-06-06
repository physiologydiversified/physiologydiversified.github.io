
// Google Analytics setup
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-ZFM74C9X28');

function openLightbox(imageSrc, title, description, author, downloadLink, type = "static", interactiveSrc = "") {
  const lightbox = document.getElementById("lightbox");
  const lightboxContainer = document.getElementById("lightbox-content-container");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxDescription = document.getElementById("lightbox-description");
  const lightboxAuthor = document.getElementById("lightbox-author");
  const lightboxCitation = document.getElementById("lightbox-citation");
  const expandBtn = document.getElementById("expand-button");

  // Clear previous content
  lightboxContainer.innerHTML = "";

  if (type === "interactive") {
    const iframe = document.createElement("iframe");
    iframe.src = interactiveSrc;
    iframe.width = "100%";
    iframe.height = "500px";
    iframe.style.border = "none";
    iframe.allow = "fullscreen";
    lightboxContainer.appendChild(iframe);

    // Show and activate expand button
    expandBtn.style.display = "inline-block";
    expandBtn.onclick = () => window.open(interactiveSrc, '_blank');
  } else {
    const img = document.createElement("img");
    img.src = imageSrc;
    img.alt = title;
    img.id = "lightbox-image";
    lightboxContainer.appendChild(img);

    // Hide expand button for static images
    expandBtn.style.display = "none";
  }

  // Set metadata
  lightboxTitle.textContent = title;
  lightboxDescription.textContent = description;
  lightboxAuthor.textContent = author;

  const currentYear = new Date().getFullYear();
  lightboxCitation.textContent = `${author} (${currentYear}). ${title}. Physiology Diversified. Retrieved from physiologydiversified.github.io`;

  // ✅ This was missing:
  lightbox.style.display = "flex";
  setTimeout(() => lightbox.classList.add("show"), 10);
}


 // Enhanced download function with Google Analytics tracking
function downloadFile(url, title = "Untitled Image") {
  // Send download event to GA4
  gtag('event', 'download', {
    'event_category': 'Image',
    'event_label': title,
    'value': 1
  });

  // Trigger the file download
  const a = document.createElement("a");
  a.href = url;
  a.download = ""; // Let browser infer the filename
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

  
  // Close Lightbox
  function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
  
    // Remove 'show' class to trigger fade-out
    lightbox.classList.remove("show");
  
    // Hide the lightbox completely after the transition ends
    setTimeout(() => {
      lightbox.style.display = "none";
    }, 400); // Match the CSS transition duration (0.4s)
  }
  
  // Download Image
//   function downloadImage(imageSrc) {
//     const a = document.createElement("a");
//     a.href = imageSrc;
//     a.download = imageSrc.split("/").pop(); // Extract the filename
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   }
  
  let currentFilter = "all"; // Track the active filter

  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      const selectedFilter = button.getAttribute('data-filter');
      const cards = document.querySelectorAll('.card');
  
      if (currentFilter === selectedFilter) {
        // Same filter clicked again → reset to show all
        currentFilter = "all";
  
        // Unhighlight all buttons
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
  
        // Show all cards
        cards.forEach(card => {
          card.style.display = 'block';
        });
      } else {
        // New filter selected
        currentFilter = selectedFilter;
  
        // Update button active state
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
  
        // Show only matching cards
        cards.forEach(card => {
          const category = card.getAttribute('data-category');
          card.style.display = (currentFilter === 'all' || currentFilter === category) ? 'block' : 'none';
        });
      }
    });
  });
  


  function toggleFavorite(event) {
    // Prevent triggering the card's onclick (lightbox)
    event.stopPropagation();
  
  }
  document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll(".card");
  
    cards.forEach((card, index) => {
      // Make each card keyboard-focusable
      card.setAttribute("tabindex", "0");
  
      // Click handler (mouse)
      card.addEventListener("click", function (event) {
        if (event.target.classList.contains("download-icon")) return;
  
        const type = card.getAttribute("data-type") || "static";
        const interactiveSrc = card.getAttribute("data-interactive-src") || "";
        const img = card.getAttribute("data-img");
        const title = card.getAttribute("data-title");
        const desc = card.getAttribute("data-desc");
        const author = card.getAttribute("data-author");
        const downloadLink = card.getAttribute("data-download");
  
        if (type === "interactive" && interactiveSrc) {
          window.open(interactiveSrc, "_blank");
        } else {
          openLightbox(img, title, desc, author, downloadLink, type, interactiveSrc);
        }
      });

      
  
      // Download icon
      const downloadIcon = card.querySelector(".download-icon");
      if (downloadIcon) {
        downloadIcon.addEventListener("click", function (event) {
          event.stopPropagation();
          const downloadLink = card.getAttribute("data-download");
          downloadFile(downloadLink, card.getAttribute("data-title"));
        });
      }
  
      // Keyboard handler
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          card.click(); // Simulate click
        }
      });
    });

    const filterButtons = document.querySelectorAll('.filter-button');

filterButtons.forEach((button, index) => {
  button.setAttribute("tabindex", "0"); // ensure focusable

  button.addEventListener("keydown", function (event) {
    const filtersArray = Array.from(filterButtons);
    const currentIndex = filtersArray.indexOf(button);

    if (event.key === "ArrowRight") {
      const next = filtersArray[currentIndex + 1] || filtersArray[0];
      next.focus();
      event.preventDefault();
    }

    if (event.key === "ArrowLeft") {
      const prev = filtersArray[currentIndex - 1] || filtersArray[filtersArray.length - 1];
      prev.focus();
      event.preventDefault();
    }

    if (event.key === "Enter" || event.key === " ") {
      button.click(); // Activate the filter
      event.preventDefault();
    }
  });
});

  
    // Optional: arrow key navigation between cards
    document.addEventListener("keydown", function (event) {
      const focusedCard = document.activeElement;
      if (!focusedCard.classList.contains("card")) return;
  
      const cardsArray = Array.from(cards);
      const currentIndex = cardsArray.indexOf(focusedCard);
  
      if (event.key === "ArrowRight") {
        const next = cardsArray[currentIndex + 1];
        if (next) next.focus();
      }
  
      if (event.key === "ArrowLeft") {
        const prev = cardsArray[currentIndex - 1];
        if (prev) prev.focus();
      }
    });
  });
  
  



  document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById("lightbox");
  
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const lightbox = document.getElementById("lightbox");
      if (lightbox && lightbox.classList.contains("show")) {
        closeLightbox();
      }
    }
  });
  
//   search functionality

  document.addEventListener("DOMContentLoaded", function () {
    const searchBar = document.querySelector(".search-bar");
    const cards = document.querySelectorAll(".card");

    searchBar.addEventListener("input", function () {
      const query = this.value.toLowerCase();

      cards.forEach(card => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        const desc = card.querySelector("p").textContent.toLowerCase();
        const category = card.getAttribute("data-category").toLowerCase();
        const dataTitle = card.getAttribute("data-title").toLowerCase();
        const dataDesc = card.getAttribute("data-desc").toLowerCase();
        const matches = [title, desc, category, dataTitle, dataDesc].some(text => text.includes(query));

        if (matches) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

    // Search functionality with highlight
  document.querySelector('.search-bar').addEventListener('input', function () {
    const searchValue = this.value.trim().toLowerCase();
    const cards = document.querySelectorAll('.card');
  
    cards.forEach(card => {
      const title = card.querySelector('h3');
      const desc = card.querySelector('p');
      const text = (title.textContent + " " + desc.textContent).toLowerCase();
  
      // Remove any old highlights
      removeHighlights(title);
      removeHighlights(desc);
  
      if (text.includes(searchValue)) {
        card.style.display = 'block';
  
        if (searchValue !== '') {
          highlightText(title, searchValue);
          highlightText(desc, searchValue);
        }
      } else {
        card.style.display = 'none';
      }
    });
  });
  
  function highlightText(element, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    element.innerHTML = element.textContent.replace(regex, '<span class="highlight">$1</span>');
  }
  
    // Function to remove highlights
  function removeHighlights(element) {
    element.innerHTML = element.textContent; // Reset to plain text
  }

  const resultsContainer = document.querySelector('.card-grid');
const noResultsMsg = document.createElement('p');
noResultsMsg.textContent = "No matching results found.";
noResultsMsg.classList.add('no-results');
resultsContainer.appendChild(noResultsMsg);

document.querySelector('.search-bar').addEventListener('input', function () {
  let matches = 0;

  cards.forEach(card => {
    const title = card.querySelector('h3');
    const desc = card.querySelector('p');
    const text = (title.textContent + " " + desc.textContent).toLowerCase();

    removeHighlights(title);
    removeHighlights(desc);

    if (text.includes(searchValue)) {
      card.style.display = 'block';
      if (searchValue !== '') {
        highlightText(title, searchValue);
        highlightText(desc, searchValue);
      }
      matches++;
    } else {
      card.style.display = 'none';
    }
  });

  noResultsMsg.style.display = matches === 0 ? 'block' : 'none';
});



  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.classList.add('visible');

        // Stagger children if this is a grid (e.g., team or sponsor logos)
        if (target.classList.contains('team-grid') || target.classList.contains('sponsor-logos')) {
          const children = target.querySelectorAll(':scope > *');
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 100}ms`;
            child.classList.add('visible');
          });
        }
      }
    });
  }, { threshold: 0.2 });

  // Observe blocks and specific containers
  document.querySelectorAll('.about-block, .team-grid, .sponsor-logos').forEach(el => {
    observer.observe(el);
  });

// Hide jump links on scroll
const jumpLinks = document.getElementById('jumpLinks');
  const aboutSection = document.getElementById('about');

  window.addEventListener('scroll', () => {
    const aboutTop = aboutSection.getBoundingClientRect().top;
    if (aboutTop < 100) {
      jumpLinks.classList.add('hide');
    } else {
      jumpLinks.classList.remove('hide');
    }
  });


  // Create scroll-up button behavior
document.addEventListener("DOMContentLoaded", function () {
  const scrollUpBtn = document.querySelector(".scroll-up-button");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 500) {
      scrollUpBtn.classList.add("show");
    } else {
      scrollUpBtn.classList.remove("show");
    }
  });

  scrollUpBtn.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});
