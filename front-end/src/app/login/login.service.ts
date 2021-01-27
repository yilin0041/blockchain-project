import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  loginReqUrl = apiUrl + "polls/login/";

  constructor(private http: HttpClient) { }

  public postLogin(username: string, password: string): Observable<any> {
    let postData = {
      name: username,
      pwd: password
    };
    return this.http.post(this.loginReqUrl, postData);
  }
}
