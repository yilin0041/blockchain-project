import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  queryReqUrl = apiUrl + "polls/balance/";

  constructor(private http: HttpClient) { }

  public getBalance(username: string): Observable<any> {
    let postData = {
      name: username
    };
    return this.http.post(this.queryReqUrl, postData);
  }
}
