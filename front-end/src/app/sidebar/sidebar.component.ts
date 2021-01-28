import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse, HttpResponseBase } from '@angular/common/http';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  currentPath = "";
  username = "";
  type = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.route.url.subscribe(url => this.currentPath = url[0].path);

    this.username = localStorage.getItem('currentUsername');
    if (this.username == null) {
      this.router.navigate(['/login']);
    }
    else if (this.username == 'pyaccount') {
      this.type = "core";
    }
    else if (this.username == 'test4' || this.username == 'bankA') {
      this.type = "bank";
    }
    else {
      this.type = "company";
    }
  }

}
