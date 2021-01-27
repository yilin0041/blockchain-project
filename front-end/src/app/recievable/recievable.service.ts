import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class RecievableService {

  financingReqUrl = apiUrl + "polls/financing/";
  transferReqUrl = apiUrl + "polls/transfer/";

  constructor(private http: HttpClient) { }

  public postFinancing(to: string, amount: number): Observable<any> {
    let postData = {
      new_to: to,
      amount: Number(amount)
    };
    return this.http.post<any>(this.financingReqUrl, postData);
  }

  public postTransfer(to: string, item: string, amount: number): Observable<any> {
    let postData = {
      new_to: to,
      product: item,
      amount: Number(amount)
    };
    return this.http.post<any>(this.transferReqUrl, postData);
  }
}
