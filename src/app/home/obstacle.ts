import { interval, Subscription } from 'rxjs'

export class Obstacle {

    baseElement: HTMLImageElement
    obstacleObj = {
        top: {
            asset: "assets/arrow.png",
            class: "obstacle-top"
        },
        bottom: {
            asset: "assets/bird.gif",
            class: "obstacle-bottom"
        }
    }

    playerElement
    gameOverCallBack: Function
    componentEndCallback: Function
    rightOffset: number = -50
    private worker: Worker
    obstacleOffsetTop

    constructor(public parent: HTMLElement, public obstacleType: string) {
        this.baseElement = document.createElement("img")
        this.baseElement.src = this.obstacleObj[obstacleType].asset
        this.baseElement.classList.add('obstacles', this.obstacleObj[this.obstacleType].class)
        this.baseElement.style.right = `${this.rightOffset}px`
        this.playerElement = this.parent.querySelector("#player")
        this.obstacleOffsetTop = window.innerHeight / 2
        parent.appendChild(this.baseElement);
        this.runWbWorkerForUpdateElement()
    }

    updateElement() {
        //this.updateAreaSubscription = this.updateArea.subscribe(() => {
        this.rightOffset += 4
        //console.log(this.playerElement.offsetHeight, this.playerElement.offsetLeft)
        if (this.rightOffset <= window.innerWidth) {
            this.baseElement.style.right = `${this.rightOffset}px`
            let left = window.innerWidth - (this.rightOffset + 30)
            if (this.obstacleType == 'top') {
                if (left < 100 && (this.obstacleOffsetTop - 20) >= this.playerElement.offsetTop) {
                    //console.log("Yaaayy!! Collision...")
                    //console.log(this.playerElement.offsetTop)
                    this.gameOverCallBack({ isGameOver: true })
                    this.worker.terminate()
                }
            } else {
                if (left < 100 && (this.obstacleOffsetTop + 20) <= (this.playerElement.offsetTop + 100)) {
                    //console.log("Yaaayy!! Collision...")
                    //console.log(this.playerElement.offsetTop)
                    this.gameOverCallBack({ isGameOver: true })
                    this.worker.terminate()
                }
            }
        } else {
            this.worker.terminate()
            this.baseElement.remove()
            this.componentEndCallback()
        }
        //})
    }

    onGameOver(cb: CallableFunction) {
        this.gameOverCallBack = cb
    }

    onComponentEnd(cb: CallableFunction) {
        this.componentEndCallback = cb
    }

    pauseGame() {
        //console.log("Stop called from parent")
        this.worker.terminate()
    }

    resumeGame() {
        //console.log("Resume called from parent")
        this.runWbWorkerForUpdateElement()
    }

    destroyComponent() {
        //console.log(this.baseElement)
        //this.baseElement.remove()
        this.parent.removeChild(this.baseElement)
    }

    runWbWorkerForUpdateElement() {
        this.worker = new Worker('./interval.worker', { type: 'module' });
        this.worker.onmessage = ({ data }) => {
            //console.log(`page got message: ${data}`);
            this.updateElement()
        };
        this.worker.postMessage(20);
    }
}

export interface GameOverEvent {
    isGameOver: boolean
}