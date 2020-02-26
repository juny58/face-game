import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { interval, Subscription, from } from 'rxjs';
import { Obstacle, GameOverEvent } from './obstacle';
import { Platform } from '@ionic/angular';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { HttpClient } from '@angular/common/http';
import { File } from '@ionic-native/file/ngx';
declare var faceapi

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {

  faceApiWorker: Worker
  obstacleCreateTimeGap = 2500
  isGameOver = false
  expression
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

  @ViewChild("video", { read: ElementRef, static: true }) videoElement: ElementRef

  constructor(public file: File, public httpClient: HttpClient, public elementRef: ElementRef, public platform: Platform, public diagnostic: Diagnostic, public screenOrientation: ScreenOrientation) {
    this.platform.ready().then(() => {
      //console.log(file.applicationDirectory)
      let platforms = this.platform.platforms()
      if (platforms.indexOf('android') >= 0 && platforms.indexOf('mobileweb') == -1) {
        this.isAndroid = true
      }
      if (this.isAndroid) {
        faceapi.env.monkeyPatch({
          Canvas: HTMLCanvasElement,
          Image: HTMLImageElement,
          ImageData: ImageData,
          //Video: HTMLVideoElement,
          readFile: (path) => {
            return new Promise((resolve, reject) => {
              file.resolveLocalFilesystemUrl(path).then(fileEntry => {
                //console.log(`File found ${fileEntry['file']}`)
                //console.log(`File path => ${path}`)
                fileEntry['file'](file => {
                  var reader = new FileReader()
                  let fileExtension = path.split("?")[0].split(".").pop();
                  if (fileExtension === "json") {
                    reader.onloadend = (e) => {
                      //console.log("JSON file => ", e)
                      return resolve(e.target['_result']);
                    };
                    reader.readAsText(file);
                  } else {
                    reader.onloadend = (e: any) => {
                      //console.log("Unit file => ", e)
                      return resolve(new Uint8Array(e.target['_result']))
                    }
                    reader.readAsArrayBuffer(file);
                  }
                })
              }).catch(err => {
                console.log("Patching error => ", err)
                return reject("Patching error => " + err)
              })
            })
          },
          createCanvasElement: () => document.createElement("canvas"),
          createImageElement: () => document.createElement("img")
        })
      }
      //this.loadFaceApi()
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

  loadFaceApi() {
    //console.log(faceapi)
    let deviceUrl = this.file.applicationDirectory + "www/assets/models/"
    let webUrl = "assets/models/"
    if (this.isAndroid) {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(deviceUrl),
        //faceapi.nets.faceLandmark68Net.loadFromDisk(url),
        //faceapi.nets.faceRecognitionNet.loadFromDisk(url),
        faceapi.nets.faceExpressionNet.loadFromDisk(deviceUrl)
      ]).then((res) => {
        // console.log(res)
        console.log("Success loading models", res)
        this.startVideo()
      })
        .catch(err => {
          console.log("Error in loading model => ", err)
        })
    } else {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(webUrl),
        //faceapi.nets.faceLandmark68Net.loadFromUri(webUrl),
        //faceapi.nets.faceRecognitionNet.loadFromUri(webUrl),
        faceapi.nets.faceExpressionNet.loadFromUri(webUrl)
      ]).then((res) => {
        // console.log(res)
        //console.log("Success loading models", res)
        this.startVideo()
      })
        .catch(err => {
          console.log("Error in loading model => ", err)
        })
    }
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
    this.hasGameStarted = true
    this.isGamePaused = false
    if (this.components.length) {
      this.components.map(c => {
        c.destroyComponent()
        c = null
      })
    }
    this.components = []
    this.createComponents()
    this.runWebWorkerForFaceApi()
  }

  ngAfterViewInit() {
    this.canvasElement = document.getElementById("canvas-container")
    this.setCurrentPlayerPositionCssVariable('0px')
  }

  createComponents() {
    // let posFn = () => {
    //   let rand = Math.random()
    //   if (rand > 0.5) {
    //     this.drawObstructions(1)
    //   } else {
    //     this.drawObstructions(2)
    //   }
    // }
    // posFn()

    // this.obstacleObserverSubscription = this.obstacleObserver.subscribe(data => {
    //   this.lastCreatedTime = new Date
    //   posFn()
    // })
    this.runWebWorkerForCreateComponent()
  }

  gameActivity(v) {
    //console.log(this.expression)
    if (this.expression == 'happy' && !this.inTransition && v > 0.65) {
      //console.log(v)
      this.phase = "bouncing"
      this.inTransition = true
      this.bounce()
      setTimeout(() => {
        this.inTransition = false
        this.phase = "normal"
      }, 2000);
    } else if (this.expression == 'surprised' || this.expression == 'angry' && !this.inTransition && v > 0.75) {
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
        this.faceApiWorker.terminate()
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

  runWebWorkerForFaceApi() {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.faceApiWorker = new Worker('./interval.worker', { type: 'module' });
      this.faceApiWorker.onmessage = ({ data }) => {
        //console.log(`page got message: ${data}`);
        this.faceApiInit()
      };
      this.faceApiWorker.postMessage(100);
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  faceApiInit() {
    faceapi.detectSingleFace(this.videoElement.nativeElement, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions().then(result => {
      if (result) {
        //console.log(result)
        let values: Array<number> = Object.values(result.expressions)
        let keys = Object.keys(result.expressions)
        let i = values.indexOf(Math.max(...values))
        //console.log(values)
        if (keys[i] != this.expression) {
          this.expression = keys[i]
          this.gameActivity(values[i])
        }
      }
    })
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