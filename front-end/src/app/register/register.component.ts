import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { RegisterService } from './register.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  validateForm!: FormGroup;
  wrongState = "";
  loading = false;
  accountType: string;

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private notification: NzNotificationService,
    private readonly registerService: RegisterService
  ) {}

  submitForm(): void {
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }

    let form = this.validateForm.value;

    this.loading = true;
    this.registerService.postRegister(form.username, this.accountType, form.password).subscribe(
      user => {
        if (user.state == 'success') {
          this.createSuccessNotification();
          this.router.navigate(['/login']);
        }
        else {
          this.wrongState = '未知错误！请重新注册！';
          this.createFailNotification();
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
      }
    );
  }

  createSuccessNotification(): void {
    this.notification
      .blank(
        'Notification',
        '注册成功！',
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
    this.validateForm = this.fb.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required]],
      type: [null, [Validators.required]]
    });
  }
}
