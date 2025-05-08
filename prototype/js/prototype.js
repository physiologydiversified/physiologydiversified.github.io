// Open Lightbox
function openLightbox(imageSrc, title, description, author, downloadLink) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxDescription = document.getElementById("lightbox-description");
    const lightboxAuthor = document.getElementById("lightbox-author");
    const lightboxCitation = document.getElementById("lightbox-citation");

      // Set Download Button
      function downloadFile(url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = ""; // Let the browser infer filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
  
    // Set Lightbox Content
    lightboxImage.src = imageSrc;
    lightboxTitle.textContent = title;
    lightboxDescription.textContent = description;
    lightboxAuthor.textContent = author;
  
  
    // Generate APA Citation
    const currentYear = new Date().getFullYear();
    lightboxCitation.textContent = `${author} (${currentYear}). ${title}. Physiology Diversified. Retrieved from https://physiologydiversified.example.com`;
  
    // Show Lightbox with Smooth Transition
    lightbox.style.display = "flex"; // Ensure it's visible
    setTimeout(() => lightbox.classList.add("show"), 10); // Add 'show' after a slight delay for animation
  
  // Set download button behavior using the dynamic link
  document.getElementById("download-button").onclick = () => {
    downloadFile(downloadLink);
  };
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
  
    // Toggle the "favorited" class on the heart icon
    const heartIcon = event.target;
    heartIcon.classList.toggle('favorited');
  }
  
  // Attach click event listeners to each card to open the lightbox
document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll(".card");
  
    cards.forEach(card => {
      card.addEventListener("click", function () {
        const img = card.getAttribute("data-img");
        const title = card.getAttribute("data-title");
        const desc = card.getAttribute("data-desc");
        const author = card.getAttribute("data-author");
        const downloadLink = card.getAttribute("data-download"); // ←pptx link from Google Drive
  
        openLightbox(img, title, desc, author, downloadLink);
      });
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    const heartIcons = document.querySelectorAll('.heart-icon'); // Select all heart icons
  
    heartIcons.forEach(icon => {
      icon.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent card click/lightbox
        this.classList.toggle('favorited'); // Toggle favorite style
      });
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


document.addEventListener("DOMContentLoaded", function () {
    const cards = document.querySelectorAll(".card");
  
    cards.forEach(card => {
      const downloadIcon = card.querySelector(".download-icon");
  
      // Lightbox event for clicking the card (but NOT the download icon)
      card.addEventListener("click", function (event) {
        // Prevent lightbox if user clicked the download icon
        if (event.target.classList.contains("download-icon")) return;
  
        const img = card.getAttribute("data-img");
        const title = card.getAttribute("data-title");
        const desc = card.getAttribute("data-desc");
        const author = card.getAttribute("data-author");
        const downloadLink = card.getAttribute("data-download");
  
        openLightbox(img, title, desc, author, downloadLink);
      });
  
      // Download button on the card
      if (downloadIcon) {
        downloadIcon.addEventListener("click", function (event) {
          event.stopPropagation(); // Prevent card click from firing
          const downloadLink = card.getAttribute("data-download");
          downloadFile(downloadLink); // Reuse your download function
        });
      }
    });
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