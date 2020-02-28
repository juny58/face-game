import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { interval, Subscription, from } from 'rxjs';
import { Obstacle, GameOverEvent } from './obstacle';
import { Platform } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { HttpClient } from '@angular/common/http';
import { File } from '@ionic-native/file/ngx';
import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';
declare var faceapi
declare var speechCommands

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {

  obstacleCreateTimeGap = 2500
  isGameOver = false
  canvasElement
  phase = "normal"
  imgSrc = {
    normal: "assets/run.gif",
    bouncing: "assets/running-still.png",
    ducking: "assets/running-lied.png"
  }
  inTransition = false
  obstacleWorker: Worker
  components: Array<Obstacle> = []
  screenTapped = false
  hasGameStarted = false
  isGamePaused = false
  backButtonSub: Subscription
  lastCreatedTime: Date
  isAndroid = false
  recognizer
  modelLoaded: ModelLoaded = 0

  @ViewChild("video", { read: ElementRef, static: true }) videoElement: ElementRef
  startTime: number;

  constructor(public speechRecognition: SpeechRecognition, public file: File, public httpClient: HttpClient, public elementRef: ElementRef, public platform: Platform, public diagnostic: Diagnostic, public screenOrientation: ScreenOrientation) {
    this.platform.ready().then(() => {
      //console.log(file.applicationDirectory)
      let platforms = this.platform.platforms()
      if (platforms.indexOf('android') >= 0 && platforms.indexOf('mobileweb') == -1) {
        this.isAndroid = true
      }
      this.startVideo()
      this.listenForCommands()
    })
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribe(() => {
      navigator['app'].exitApp()
    })

    this.platform.ready().then(() => {
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.LANDSCAPE_PRIMARY).then(() => {
      }).catch((err) => console.log(err))
    })
  }

  ionViewDidLeave() {
    this.backButtonSub.unsubscribe()
    this.screenOrientation.unlock()
    this.playOrPause(2)
  }

  startVideo() {
    if (this.isAndroid) {
      this.diagnostic.requestRuntimePermission(this.diagnostic.permission.CAMERA).then(status => {
        // console.log("Permission status", status)
        if (this.diagnostic.permissionStatus.GRANTED) {
          navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            this.videoElement.nativeElement.srcObject = stream
            console.log("Stream is => ", stream)
          }, err => {
            console.log("Usermedia error => ", err)
          })
        }
      }).catch((err) => {
        //console.log("Permission error => ", err)
      })
    } else {
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
        this.videoElement.nativeElement.srcObject = stream
        // console.log("Stream is => ", stream)
      }, err => {
        //console.log("Usermedia error => ", err)
      })
    }
  }

  startGame() {
    if (!this.startTime) {
      this.startTime = (new Date).getMilliseconds()
    }
    if (this.modelLoaded == 1) {
      this.hasGameStarted = true
      this.isGamePaused = false
      if (this.components.length) {
        this.components.map(c => {
          c.destroyComponent()
          c = null
        })
      }
      this.components = []
      this.startTime = null
      this.createComponents()
    } else {
      if (((new Date).getMilliseconds() - this.startTime) > 10000) {
        alert("Sorry, your connection is too slow.")
      } else {
        if (this.modelLoaded == 0) {
          this.startGame()
        } else {
          alert("Sorry, your connection is too slow.")
        }
      }
    }
  }

  ngAfterViewInit() {
    this.canvasElement = document.getElementById("canvas-container")
    this.setCurrentPlayerPositionCssVariable('0px')
  }

  async listenForCommands() {
    this.recognizer = speechCommands.create('BROWSER_FFT');
    try {
      await this.recognizer.ensureModelLoaded();
      let words = this.recognizer.wordLabels()
      //console.log(words)
      this.modelLoaded = 1
      this.recognizer.listen(({ scores }) => {
        scores = Array.from(scores).map((s, i) => ({ score: s, word: words[i] }));
        // Find the most probable word.
        scores.sort((s1, s2) => s2.score - s1.score);
        //console.log(scores[0])
        //console.log(word)
        if (this.hasGameStarted && scores[0].score > .9) {
          this.gameActivity(scores[0].word)
        }
      }, { probabilityThreshold: 0.5 })
    } catch {
      this.modelLoaded = 2
    }
  }

  createComponents() {
    this.runWebWorkerForCreateComponent()
  }

  gameActivity(direction: string) {
    //console.log(this.expression)
    if (direction == 'up' && !this.inTransition) {
      //console.log(v)
      this.phase = "bouncing"
      this.inTransition = true
      this.bounce()
      setTimeout(() => {
        this.inTransition = false
        this.phase = "normal"
      }, 2000);
    } else if (direction == 'down' && !this.inTransition) {
      //console.log(v)
      this.phase = "ducking"
      this.inTransition = true
      this.duck()
      setTimeout(() => {
        this.inTransition = false
        this.phase = "normal"
      }, 2000);
    } else {
      //console.log("Normal")
    }
  }

  setCurrentPlayerPositionCssVariable(px) {
    document.documentElement.style.setProperty("--offsetTop", px)
  }

  duck() {
    let offset = 0
    let hitOffset = false
    let int = interval(20).subscribe(() => {
      if (offset < 100 && !hitOffset) {
        offset += 2
        if (offset == 100) {
          hitOffset = true
        }
      } else {
        offset -= 2
        if (offset == 0) {
          int.unsubscribe()
        }
      }
      this.setCurrentPlayerPositionCssVariable(`${offset}px`)
    })
  }

  bounce() {
    let offset = 0
    let hitOffset = false
    let int = interval(20).subscribe(() => {
      if (offset > -100 && !hitOffset) {
        offset -= 2
        if (offset == -100) {
          hitOffset = true
        }
      } else {
        offset += 2
      }
      //console.log(offset, document.getElementById('player').offsetTop)
      this.setCurrentPlayerPositionCssVariable(`${offset}px`)
      if (offset == 0) {
        int.unsubscribe()
      }
    })
  }

  drawObstructions(position) {
    let type: string
    if (position == 1) {
      type = 'top'
    } else {
      type = 'bottom'
    }

    let obstacleComponent: Obstacle = new Obstacle(this.canvasElement, type)
    this.components.push(obstacleComponent)
    //console.log(obstacleComponent)
    obstacleComponent.onGameOver((e: GameOverEvent) => {
      //console.log(e)
      //console.log(obstacleComponent)
      if (e.isGameOver) {
        this.isGameOver = true
        this.obstacleWorker.terminate()
        this.stopComponentPropagation()
        setTimeout(() => {
          this.hasGameStarted = false
        }, 500);
      }
    })

    obstacleComponent.onComponentEnd(() => {
      //console.log("Component ended")
      setTimeout(() => {
        obstacleComponent = null
        let i = this.components.indexOf(null)
        this.components.splice(i, 1)
      }, 100);
    })
  }

  stopComponentPropagation() {
    this.components.forEach(el => {
      el.pauseGame()
    })
  }

  screenTap() {
    if (!this.screenTapped) {
      this.screenTapped = true
      setTimeout(() => {
        this.screenTapped = false
      }, 2500);
    }
  }

  playOrPause(n) {
    if (n == 1) {
      this.isGamePaused = false
      let elapsedTime = (new Date).getMilliseconds() - this.lastCreatedTime.getMilliseconds()
      let nextTimeToCreate: number = Math.ceil(elapsedTime / this.obstacleCreateTimeGap) * this.obstacleCreateTimeGap - elapsedTime
      setTimeout(() => {
        this.createComponents()
      }, nextTimeToCreate);
      this.components.map(o => {
        o.resumeGame()
      })
    } else {
      this.isGamePaused = true
      this.obstacleWorker.terminate()
      this.components.map(o => {
        o.pauseGame()
      })
    }
  }

  runWebWorkerForCreateComponent() {
    this.obstacleWorker = new Worker('./home.worker', { type: 'module' });
    this.obstacleWorker.onmessage = ({ data }) => {
      //console.log(`page got message: ${data}`);
      this.lastCreatedTime = new Date;
      this.drawObstructions(data)
    };
    this.obstacleWorker.postMessage(this.obstacleCreateTimeGap);
  }

}

export enum ModelLoaded {
  "NotFailed" = 0,
  "Loaded" = 1,
  "LoadFailed" = 2
}