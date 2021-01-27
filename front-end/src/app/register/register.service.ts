import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {

  registerReqUrl = apiUrl + "polls/register/";

  constructor(private http: HttpClient) { }

  public postRegister(username: string, type: string, password: string): Observable<any> {
    let accountType = type == 'bank' ? true : false;
    let postData = {
      name: username,
      type: accountType,
      pwd: password
    };
    return this.http.post(this.registerReqUrl, postData);
  }
}
