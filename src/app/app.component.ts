import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages = [
    {
      title: 'Home',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'List',
      url: '/list',
      icon: 'list'
    }
  ];

  constructor(
    private platform: Platform,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
    document.documentElement.style.setProperty("--width", `${window.innerWidth}px`)
    document.documentElement.style.setProperty("--height", `${window.innerHeight}px`)
    
    window.onresize = () => {
      document.documentElement.style.setProperty("--width", `${window.innerWidth}px`)
      document.documentElement.style.setProperty("--height", `${window.innerHeight}px`)
    }
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.backgroundColorByHexString("#00e5ff")
    });
  }
}
