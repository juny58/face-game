const functions = require('firebase-functions');
var fetch = require('node-fetch');
require("@tensorflow/tfjs-node")
const stringify = require('json-stringify-safe')

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
// var canvas = require('canvas');

var faceapi = require('face-api.js');

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
// const { Canvas, Image, ImageData } = canvas
var path = require('path')
faceapi.env.monkeyPatch({ fetch })

const MODELS_URL = path.join(__dirname, '/models');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getFaceApi = functions.https.onRequest((request, response) => {
    Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(MODELS_URL),
        faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_URL),
        faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_URL),
        faceapi.nets.faceExpressionNet.loadFromDisk(MODELS_URL)
    ]).then((res) => {
        console.log("Loaded model")
        return response.send(faceapi)
    }).catch(err => {
        console.log("Error in loading model => ", err)
        return response.send("Error in loading model => ", err)
    })
});
