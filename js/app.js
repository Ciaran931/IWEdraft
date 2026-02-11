let dictionary = [
  {
    id: "appreciate",
    word: "appreciate",
    pos: "verb",
    definition_en: "to recognize the value of something",
    definition_pl: "doceniać"
  }
];

const popup = document.getElementById("popup");
const popupContent = document.getElementById("popup-content");
const closeBtn = document.getElementById("close-popup");

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("word")) {
    const id = e.target.dataset.id;
    const wordData = dictionary.find(w => w.id === id);
    if (wordData) showPopup(wordData);
  }
});

closeBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
});

function showPopup(word) {
  popupContent.innerHTML = `
    <strong>${word.word}</strong><br>
    <em>${word.pos}</em><br>
    EN: ${word.definition_en}<br>
    PL: ${word.definition_pl}
  `;
  popup.classList.remove("hidden");
}
