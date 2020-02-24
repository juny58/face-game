import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { File } from '@ionic-native/file/ngx';
import * as firebase from 'firebase'

var firebaseConfig = {
  apiKey: "AIzaSyCqr9Sn5diMteVQ2mp5nXCB7ohJ_NMooUQ",
  authDomain: "face-api-game.firebaseapp.com",
  databaseURL: "https://face-api-game.firebaseio.com",
  projectId: "face-api-game",
  storageBucket: "face-api-game.appspot.com",
  messagingSenderId: "214389678488",
  appId: "1:214389678488:web:339f61f95afac4fdaf4bed",
  measurementId: "G-0FVPK2K51H"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    ScreenOrientation,
    Diagnostic,
    File,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
