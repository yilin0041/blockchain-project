import { Component, OnInit } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  username = "";
  address = "";
  balance = 0;
  isSpinning: boolean;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.isSpinning = true;
    this.username = localStorage.getItem('currentUsername');
    this.address = localStorage.getItem('currentAddress');
    this.userService.getBalance(this.username).subscribe(res => {
      this.balance = res.data[0];
      this.isSpinning = false;
    });
  }

}
