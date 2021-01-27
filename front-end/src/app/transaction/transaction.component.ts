import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzTableLayout, NzTablePaginationPosition, NzTableSize } from 'ng-zorro-antd/table';
import { PayableService } from '../payable/payable.service';
import { TransactionService } from './transaction.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';

interface ItemData {
  payer: string;
  reciever: string;
  item: string;
  amount: number;
  status: string;
  certificated: string;
  id: number;
}

interface Setting {
  bordered: boolean;
  pagination: boolean;
  title: boolean;
  header: boolean;
  fixHeader: boolean;
  ellipsis: boolean;
  simple: boolean;
  loading: boolean;
  size: NzTableSize;
  tableScroll: string;
  tableLayout: NzTableLayout;
  position: NzTablePaginationPosition;
}

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent implements OnInit {
  settingForm?: FormGroup;
  listOfData: ItemData[] = [];
  displayData: ItemData[] = [];
  fixedColumn = false;
  scrollX: string | null = null;
  scrollY: string | null = null;
  settingValue!: Setting;

  successState = "";
  wrongState = "";
  loading = false;

  isSpinning: boolean;

  confirmSort = {
    compare: (a: ItemData, b: ItemData) => a.certificated.localeCompare(b.certificated),
    sortOrder: 'ascend',
    priority: 4
  };

  statusSort = {
    compare: (a: ItemData, b: ItemData) => a.status.localeCompare(b.status),
    sortOrder: 'ascend',
    priority: 3
  };

  amountSort = {
    compare: (a: ItemData, b: ItemData) => a.amount - b.amount,
    sortOrder: 'ascend',
    priority: 2
  };

  itemSort = {
    compare: (a: ItemData, b: ItemData) => a.item.localeCompare(b.item),
    sortOrder: 'ascend',
    priority: 1
  };

  confirm(id: number): void {
    this.loading = true;
    this.transactionService.postConfirm(id).subscribe(res => {
      if (res.state == 0) {
        this.successState = '验证成功!';
        this.createSuccessNotification();
        this.getData();
      }
      else {
        this.wrongState = "未知错误！请重新验证！";
        this.createFailNotification();
      }
    });
    this.loading = false;
  }

  createSuccessNotification(): void {
    this.notification
      .blank(
        'Notification',
        this.successState,
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

  currentPageDataChange($event: ItemData[]): void {
    this.displayData = $event;
  }

  getData(): void {
    this.listOfData = [];
    // this.settingForm.value.loading = true;
    this.isSpinning = true;
    let id = JSON.parse(localStorage.getItem('r_id'));

    for (let i = 0; i < id.length; i++) {
      this.payableService.postQuery(id[i]).subscribe(res => {
        if (res.data[3] != 0) {
          this.listOfData = [...this.listOfData, {
          payer: res.data[0],
          reciever: res.data[1],
          item: res.data[2],
          amount: res.data[3],
          status: res.data[4] == 0 ? '未结算' : '已结算',
          certificated: res.data[5] ? '是' : '否',
          id: id[i]
        }];
        }
        if (i == id.length - 1)
          this.isSpinning = false;
          // this.settingForm.value.loading = false;
      });
    }
  }

  constructor(
    private formBuilder: FormBuilder,
    private readonly payableService: PayableService,
    private readonly transactionService: TransactionService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.isSpinning = true;
    this.settingForm = this.formBuilder.group({
      bordered: false,
      loading: false,
      pagination: true,
      title: false,
      header: true,
      fixHeader: true,
      ellipsis: false,
      simple: true,
      size: 'middle',
      tableScroll: 'unset',
      tableLayout: 'auto',
      position: 'bottom'
    });
    this.settingValue = this.settingForm.value;
    this.settingForm.valueChanges.subscribe(value => (this.settingValue = value));
    this.settingForm.get('tableScroll')!.valueChanges.subscribe(scroll => {
      this.fixedColumn = scroll === 'fixed';
      this.scrollX = scroll === 'scroll' || scroll === 'fixed' ? '100vw' : null;
    });
    this.settingForm.get('fixHeader')!.valueChanges.subscribe(fixed => {
      this.scrollY = fixed ? '240px' : null;
    });

    this.getData();
  }

}
