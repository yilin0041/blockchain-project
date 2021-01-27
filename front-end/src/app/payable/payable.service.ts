import { Injectable } from '@angular/core';
import { Observable } from  'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse, HttpResponseBase } from '@angular/common/http';
import { apiUrl } from '../app.config';

interface ItemData {
  payer: string;
  reciever: string;
  item: string;
  amount: number;
  status: string;
  certificated: string;
}

@Injectable({
  providedIn: 'root'
})
export class PayableService {

  queryReqUrl = apiUrl + "polls/find/";
  createReqUrl = apiUrl + "polls/create/";
  settleReqUrl = apiUrl + "polls/settle/";

  constructor(private http: HttpClient) { }

  public postQuery(id: number): Observable<any> {
    let postData = {
      r_id: id
    };
    return this.http.post(this.queryReqUrl, postData);
  }

  public postCreate(reciever: string, item: string, amount: number): Observable<any> {
    let postData = {
      to: reciever,
      product: item,
      amount: Number(amount)
    };
    return this.http.post(this.createReqUrl, postData);
  }

  public postSettle(id: number): Observable<any> {
    let postData = {
      r_id: id
    };
    return this.http.post(this.settleReqUrl, postData);
  }
}
