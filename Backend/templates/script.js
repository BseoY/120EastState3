// Get modal and close button elements
var modal = document.getElementById("searchArchives");
var closeBtn = document.getElementById("CloseSearchArchives");
var openBtn = document.getElementById("openModalBtn");

// When the user clicks the button, open the modal
openBtn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on the close button, close the modal
closeBtn.onclick = function() {
  modal.style.display = "none";
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}