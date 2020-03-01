/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  console.log(data)
  // Find the most probable word.
  let scores = data.scores
  let words = data.words
  scores.sort((s1, s2) => s2.score - s1.score);
  console.log(scores)
  scores = Array.from(scores).map((s, i) => ({ score: s, word: words[i] }));
  postMessage(scores[0])
});

/*
let worker = new Worker("./listener.worker.ts", { type: 'module' })
      this.recognizer.listen(({ scores }) => {
        worker.postMessage({ scores: scores, words: words })
        worker.onmessage = ({data}) => {
          console.log(data)
          if (this.hasGameStarted && data.score > .9) {
            this.gameActivity(data.word)
          }
        }
      }, { probabilityThreshold: 0.75 })
*/
