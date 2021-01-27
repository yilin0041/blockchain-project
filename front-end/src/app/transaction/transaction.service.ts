import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  confirmReqUrl = apiUrl + "polls/confirm/";

  constructor(private http: HttpClient) { }

  public postConfirm(id: number): Observable<any> {
    let postData = {
      r_id: id
    };
    return this.http.post(this.confirmReqUrl, postData);
  }
}
