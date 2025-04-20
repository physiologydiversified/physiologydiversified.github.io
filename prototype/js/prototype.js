// Open Lightbox
function openLightbox(imageSrc, title, description, author) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxTitle = document.getElementById("lightbox-title");
    const lightboxDescription = document.getElementById("lightbox-description");
    const lightboxAuthor = document.getElementById("lightbox-author");
    const lightboxCitation = document.getElementById("lightbox-citation");
  
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
  
    // Set Download Link
    document.getElementById("download-button").onclick = () => downloadImage(imageSrc);
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
  function downloadImage(imageSrc) {
    const a = document.createElement("a");
    a.href = imageSrc;
    a.download = imageSrc.split("/").pop(); // Extract the filename
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      // Remove 'active' class from all buttons
      document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
  
      // Add 'active' class to the clicked button
      button.classList.add('active');
  
      // Filter logic
      const filter = button.getAttribute('data-filter');
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        card.style.display = (filter === 'all' || filter === category) ? 'block' : 'none';
      });
    });
  });

  // Add event listeners to all filter buttons
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter'); // Get the category to filter
  
      // Get all cards
      const cards = document.querySelectorAll('.card');
  
      cards.forEach(card => {
        const category = card.getAttribute('data-category'); // Get the card's category
  
        if (filter === 'all' || filter === category) {
          card.style.display = 'block'; // Show the card if it matches the filter or if 'all' is selected
        } else {
          card.style.display = 'none'; // Hide the card if it doesn't match the filter
        }
      });
    });
  });

  function toggleFavorite(event) {
    // Prevent triggering the card's onclick (lightbox)
    event.stopPropagation();
  
    // Toggle the "favorited" class on the heart icon
    const heartIcon = event.target;
    heartIcon.classList.toggle('favorited');
  }
  