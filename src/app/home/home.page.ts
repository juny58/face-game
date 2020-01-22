import { Component, ElementRef, ViewChild } from '@angular/core';
import * as faceapi from 'face-api.js'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild("video", { read: ElementRef, static: true }) videoElement: ElementRef

  constructor() {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/src/app/home/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/src/app/home/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/src/app/home/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/src/app/home/models')
    ]).then(this.startVideo)
  }

  playing(e) {
    console.log(e)
  }

  startVideo() {
    navigator.getUserMedia({ video: {} }, stream => {
      this.videoElement.nativeElement.srcObject = stream
    }, err => {
      console.log(err)
    })
  }

}
