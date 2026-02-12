let dictionary = [];

fetch("words.json") // loads words from the same folder
  .then(res => res.json())
  .then(data => dictionary = data);

const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const closeBtn = document.getElementById("close-popup");

document.addEventListener("click", e => {
  if (e.target.classList.contains("word")) {
    const wordData = dictionary.find(w => w.id === e.target.dataset.id);
    if (wordData) showPopup(wordData);
  }
});

closeBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
});

function showPopup(word) {
  popupContent.innerHTML = `
    <strong>${word.word}</strong> <em>${word.pos || '-'}</em><br>  
    <strong>Translation:</strong> ${word.pl_translation || '-'}<br>
    <strong>EN Definition:</strong> ${word.en_definition || '-'}<br>
    <strong>PL Definition:</strong> ${word.pl_definition || '-'}<br>
    ${word.example ? `<strong>Example:</strong> ${word.example}` : ''}
  `;
  popup.classList.remove("hidden");
}

