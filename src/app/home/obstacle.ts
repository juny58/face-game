import { interval, Subscription } from 'rxjs'

export class Obstacle {

    baseElement
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
    updateArea = interval(20)
    updateAreaSubscription: Subscription
    componentEndCallback: Function
    rightOffset: number = -50

    constructor(public parent: HTMLElement, public obstacleType: string) {
        this.baseElement = document.createElement("img")
        this.baseElement.src = this.obstacleObj[obstacleType].asset
        this.baseElement.classList.add('obstacles', this.obstacleObj[this.obstacleType].class)
        this.baseElement.style.right = `${this.rightOffset}px`
        parent.appendChild(this.baseElement);
        this.updateElement()
        this.playerElement = this.parent.querySelector("#player")
    }

    updateElement() {
        this.updateAreaSubscription = this.updateArea.subscribe(() => {
            this.rightOffset += 2
            //console.log(this.playerElement.offsetHeight, this.playerElement.offsetLeft)
            if (this.rightOffset <= window.innerWidth) {
                this.baseElement.style.right = `${this.rightOffset}px`
                let top = 200
                let left = window.innerWidth - (this.rightOffset + 50)
                if (left < 100 && top > this.playerElement.offsetTop) {
                    //console.log("Yaaayy!! Collision...")
                    this.gameOverCallBack({ isGameOver: true })
                    this.updateAreaSubscription.unsubscribe()
                }
            } else {
                this.updateAreaSubscription.unsubscribe()
                this.parent.removeChild(this.baseElement)
                this.componentEndCallback()
            }
        })
    }

    onGameOver(cb: CallableFunction) {
        this.gameOverCallBack = cb
    }

    onComponentEnd(cb: CallableFunction) {
        this.componentEndCallback = cb
    }

    pauseGame() {
        console.log("Stop called from parent")
        this.updateAreaSubscription.unsubscribe()
    }

    resumeGame() {
        console.log("Resume called from parent")
        this.updateElement()
    }

    destroyComponent() {
        this.parent.removeChild(this.baseElement)
    }
}

export interface GameOverEvent {
    isGameOver: boolean
}