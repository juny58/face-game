/// <reference lib="webworker" />
let words = ["down", "left", "right", "up", "_background_noise_", "_unknown_"]
addEventListener('message', ({ data }) => {
  //console.log(data)
  // Find the most probable word.
  data = Array.from(data).map((s, i) => ({ score: s, word: words[i] }));
  // Find the most probable word.
  data.sort((s1, s2) => s2.score - s1.score);
  //console.log(data[0])
  if (data[0].score > .5) {
    postMessage(data[0].word)
  }
})