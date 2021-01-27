import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from './login.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  validateForm!: FormGroup;
  wrongState = "";
  loading = false;

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private notification: NzNotificationService,
    private readonly loginService: LoginService,
  ) {}

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }

    this.loading = true;
    this.loginService.postLogin(this.validateForm.value.username, this.validateForm.value.password).subscribe(
      user => {
        if (user.state == 'success') {
          localStorage.setItem('currentUsername', this.validateForm.value.username);
          localStorage.setItem('currentAddress', user.address);

          this.createSuccessNotification();
          // to be modified
          this.router.navigate(['/user']);
        }
        else {
          if (user.state == 'no_user') {
            this.wrongState = '用户不存在！';
          }
          else if (user.state == 'pwd_error') {
            this.wrongState = '密码错误！';
          }
          this.createFailNotification();
          this.loading = false;
        }
      },
      error => {
        console.log(error);
        this.loading = false;
      }
    );
  }

  createSuccessNotification(): void {
    this.notification
      .blank(
        'Notification',
        '欢迎回来！',
        {
          nzPlacement: 'bottomRight'
        }
      )
      .onClick.subscribe(() => {
      });
  }

  createFailNotification(): void {
    this.notification
      .blank(
        'Notification',
        this.wrongState,
        {
          nzPlacement: 'bottomRight'
        }
      )
      .onClick.subscribe(() => {
      });
  }

  ngOnInit(): void {
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentAddress');
    this.validateForm = this.fb.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required]]
    });
  }
}
