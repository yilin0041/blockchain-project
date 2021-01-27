import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzTableLayout, NzTablePaginationPosition, NzTableSize } from 'ng-zorro-antd/table';
import { PayableService } from './payable.service';
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
  selector: 'app-payable',
  templateUrl: './payable.component.html',
  styleUrls: ['./payable.component.scss']
})

export class PayableComponent implements OnInit {
  settingForm?: FormGroup;
  listOfData: ItemData[] = [];
  displayData: ItemData[] = [];
  fixedColumn = false;
  scrollX: string | null = null;
  scrollY: string | null = null;
  settingValue!: Setting;

  validateForm!: FormGroup;
  successState = "";
  wrongState = "";

  isCreateVisible: boolean;
  isCreateOkLoading: boolean;

  isSpinning: boolean;

  statusSort = {
    compare: (a: ItemData, b: ItemData) => a.status.localeCompare(b.status),
    sortOrder: 'ascend',
    priority: 4
  };

  confirmSort = {
    compare: (a: ItemData, b: ItemData) => b.certificated.localeCompare(a.certificated),
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

  showCreateModal(): void {
    this.isCreateVisible = true;
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

  handleCreateOk(): void {
    this.isCreateOkLoading = true;
    let form = this.validateForm.value;

    if (form.amount == '0') {
      this.wrongState = "签发单据数额不能为零！";
      this.createFailNotification();
      this.isCreateOkLoading = false;
      return;
    }

    this.payableService.postCreate(form.reciever, form.item, form.amount).subscribe(res => {
      if (res.state === 'success') {
        if (res.data[0] == 0) {
          this.successState = '单据签发成功!';
          this.createSuccessNotification();
          this.getData();
          let new_id = JSON.parse(localStorage.getItem('r_id')).push(res.data[1]);
          localStorage.setItem('r_id', JSON.stringify(new_id));
          this.isCreateVisible = false;
        }
        else if (res.data[0] == -1) {
          this.wrongState = "非核心企业没有签发单据的权限！";
          this.createFailNotification();
        }
        else if (res.data[0] == -2) {
          this.wrongState = "收款方与付款方不能为同一实体！";
          this.createFailNotification();
        }
      }
      else if (res.state === 'no_user'){
        this.wrongState = "收款方不存在！";
        this.createFailNotification();
      }
      this.isCreateOkLoading = false;
    });
  }

  handleCreateCancel(): void {
    this.isCreateVisible = false;
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

  settle(id: number): void{
    this.payableService.postSettle(id).subscribe(res => {
      if (res.state == '0') {
        this.successState = '结算成功!';
        this.createSuccessNotification();
        this.getData();
      }
      else {
        this.wrongState = "非核心企业没有结算权限！";
        this.createFailNotification();
      }
    });
  }

  constructor(
    private formBuilder: FormBuilder,
    private fb: FormBuilder,
    private readonly payableService: PayableService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    if (localStorage.getItem('r_id') == null) {
      localStorage.setItem('r_id', JSON.stringify([1, 2, 3, 4, 5, 6, 7]));
    }

    this.isSpinning = true;
    this.settingForm = this.formBuilder.group({
      bordered: false,
      loading: false, //////
      pagination: true,
      title: false,
      header: true,
      fixHeader: false,
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

    this.validateForm = this.fb.group({
      reciever: [null, [Validators.required]],
      item: [null, [Validators.required]],
      amount: [null, [Validators.required]]
    });
  }
}
