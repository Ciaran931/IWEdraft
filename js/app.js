let dictionary = [];
let selectedWordElement = null;

fetch("words.json") // loads words from the same folder
  .then(res => res.json())
  .then(data => dictionary = data);

const sidebarContent = document.getElementById("sidebar-content");

document.addEventListener("click", e => {
  if (e.target.classList.contains("word")) {
    // Remove highlight from previous word
    if (selectedWordElement) {
      selectedWordElement.classList.remove("selected");
    }

    // Highlight current word
    selectedWordElement = e.target;
    selectedWordElement.classList.add("selected");

    // Show word info in sidebar
    const wordData = dictionary.find(w => w.id === e.target.dataset.id);
    if (wordData) showSidebar(wordData);
  }
});

function showSidebar(word) {
  sidebarContent.innerHTML = `
    <div><strong>Word:</strong> ${word.word}</div><br>
    <div><strong>Part of Speech:</strong> ${word.pos}</div><br>
    <div><strong>EN Definition:</strong> ${word.en_definition}</div><br>
    <div><strong>PL Definition:</strong> ${word.pl_definition}</div><br>
    <div><strong>Translation:</strong> ${word.pl_translation}</div><br>
    <div><strong>Example:</strong> <em>${word.example}</em></div>
  `;
}
