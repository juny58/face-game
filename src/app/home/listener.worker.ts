/// <reference lib="webworker" />
let words = ["_background_noise_", "_unknown_", "down", "eight", "five", "four", "go", "left", "nine", "no", "one", "right", "seven", "six", "stop", "three", "two", "up", "yes", "zero"]

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