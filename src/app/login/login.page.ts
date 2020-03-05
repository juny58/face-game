import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as firebase from 'firebase'
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit {

  phone: number
  spinNow


  constructor(public router: Router) { }

  ngOnInit() { }

  ngAfterViewInit() { }

  proceed() {
    if(!this.phone){
      return alert("No phone number given")
    }
    if (this.phone.toString().length != 10) {
      return alert("Wrong phone number.")
    }
    this.spinNow = true
    firebase.firestore().collection('user').add({
      phone: Number(this.phone)
    }).then(() => {
      this.spinNow = false
      localStorage.setItem("currentUser", this.phone.toString())
      this.router.navigate(['/home'], { replaceUrl: true })
    })
  }

}
