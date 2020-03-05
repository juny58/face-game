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
  receivedOtp: string
  otpSent: boolean
  recaptchaVerifier
  confirmationResult

  constructor(public router: Router) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', {
      'size': 'invisible'
    });
  }

  signIn() {
    let mobile = '+91' + this.phone
    firebase.auth().signInWithPhoneNumber(mobile, this.recaptchaVerifier)
      .then((confirmationResult) => {
        // SMS sent. Prompt user to type the code from the message, then sign the
        // user in with confirmationResult.confirm(code).
        this.otpSent = true
        this.confirmationResult = confirmationResult;
        this.phone = null
      }).catch((error) => {
        // Error; SMS not sent
        // ...
        console.log(error);
      });
  }

  verify() {
    this.confirmationResult.confirm(this.receivedOtp).then((user) => {
      localStorage.setItem("currentUser", JSON.stringify(user))
      this.router.navigate(['/home'], { replaceUrl: true })
    })
  }

}
