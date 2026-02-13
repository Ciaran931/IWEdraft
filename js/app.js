let dictionary = [];
let selectedWordElement = null;

// Load words data
fetch("words.json")
  .then(res => res.json())
  .then(data => dictionary = data);

const sidebarContent = document.getElementById("sidebar-content");

// Keep track of highlighted sentence
let highlightedSentenceEN = null;
let highlightedSentencePL = null;

document.addEventListener("click", e => {
  // Clicked a word
  if (e.target.classList.contains("word")) {

    // Remove previous word highlight
    if (selectedWordElement) selectedWordElement.classList.remove("selected");
    selectedWordElement = e.target;
    selectedWordElement.classList.add("selected");

    // Remove previous sentence highlights
    if (highlightedSentenceEN) highlightedSentenceEN.classList.remove("sentence-highlight");
    if (highlightedSentencePL) highlightedSentencePL.classList.remove("sentence-highlight");

    // Highlight sentence containing the word
    const sentenceEN = selectedWordElement.closest(".english-sentence");
    if (sentenceEN) {
      sentenceEN.classList.add("sentence-highlight");
      highlightedSentenceEN = sentenceEN;

      // Find corresponding Polish sentence
      const paragraph = sentenceEN.closest(".paragraph");
      if (paragraph) {
        const sentenceNumber = sentenceEN.dataset.sentence;
        const plSentence = paragraph.querySelector(`.polish-sentence[data-sentence="${sentenceNumber}"]`);
        if (plSentence) {
          plSentence.classList.add("sentence-highlight");
          highlightedSentencePL = plSentence;
        }
      }
    }

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
