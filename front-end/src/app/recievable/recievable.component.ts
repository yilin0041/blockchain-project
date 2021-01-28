import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NzTableLayout, NzTablePaginationPosition, NzTableSize } from 'ng-zorro-antd/table';
import { RecievableService } from './recievable.service';
import { PayableService } from '../payable/payable.service';
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
  selector: 'app-recievable',
  templateUrl: './recievable.component.html',
  styleUrls: ['./recievable.component.scss']
})

export class RecievableComponent implements OnInit {
  settingForm?: FormGroup;
  listOfData: ItemData[] = [];
  displayData: ItemData[] = [];
  allChecked = false;
  indeterminate = false;
  fixedColumn = false;
  scrollX: string | null = null;
  scrollY: string | null = null;
  settingValue!: Setting;

  tForm!: FormGroup;
  fForm!: FormGroup;
  successState = "";
  wrongState = "";

  isFinancingVisible: boolean;
  isFinancingOkLoading: boolean;
  isTransferVisible: boolean;
  isTransferOkLoading: boolean;

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

  handleFinancingOk(): void {
    this.isFinancingOkLoading = true;
    let form = this.fForm.value;

    if (form.amount == '0') {
      this.wrongState = "融资数额不能为零！";
      this.createFailNotification();
      this.isFinancingOkLoading = false;
      return;
    }

    this.recievableService.postFinancing(form.newReciever, form.amount).subscribe(res => {
      if (res.state == 'success') {
        if (res.data[0] == 0) {
          this.successState = '融资成功!';
          let new_id = JSON.parse(localStorage.getItem('r_id'));
          let new_idSet = new Set(new_id);
          new_idSet.add(res.data[1]);
          new_id = [...new_idSet];
          localStorage.setItem('r_id', JSON.stringify(new_id));
          this.createSuccessNotification();
          this.getData();
          this.isFinancingVisible = false;
        }
      }
      else if (res.state == 'error(-1)') {
        this.wrongState = "融资失败：融资对象必须是银行！";
        this.createFailNotification();
      }
      else if (res.state == 'error(-2)') {
        this.wrongState = "融资失败：融资数额超过应收账款总额！";
        this.createFailNotification();
      }
      else if (res.state === 'no_user'){
        this.wrongState = "融资对象不存在！";
        this.createFailNotification();
      }
      this.isFinancingOkLoading = false;
    });
  }

  handleTransferOk(): void {
    this.isTransferOkLoading = true;
    let form = this.tForm.value;

    if (form.amount == '0') {
      this.wrongState = "转让数额不能为零！";
      this.createFailNotification();
      this.isTransferOkLoading = false;
      return;
    }

    this.recievableService.postTransfer(form.newReciever, form.item, form.amount).subscribe(res => {
      if (res.state == 'success') {
        if (res.data[0] == 0) {
          this.successState = '账款转让成功!';
          let new_id = JSON.parse(localStorage.getItem('r_id'));
          let new_idSet = new Set(new_id);
          new_idSet.add(res.data[1]);
          new_id = [...new_idSet];
          localStorage.setItem('r_id', JSON.stringify(new_id));
          this.createSuccessNotification();
          this.getData();
          this.isTransferVisible = false;
        }
        else if (res.data[0] == -1) {
          this.wrongState = "账款转让失败：转让对象必须是其他企业！";
          this.createFailNotification();
        }
        else if (res.data[0] == -2) {
          this.wrongState = "账款转让失败：转让数额超过应收账款总额！";
          this.createFailNotification();
        }
      }
      else if (res.state === 'no_user'){
        this.wrongState = "融资对象不存在！";
        this.createFailNotification();
      }
      this.isTransferOkLoading = false;
    });
  }

  handleFinancingCancel(): void {
    this.isFinancingVisible = false;
  }

  handleTransferCancel(): void {
    this.isTransferVisible = false;
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
        if (res.data[1] == localStorage.getItem('currentUsername').toLowerCase()) {
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

  showFinancingModal(): void {
    this.isFinancingVisible = true;
  }

  showTransferModal(): void {
    this.isTransferVisible = true;
  }

  constructor(
    private formBuilder: FormBuilder,
    private fb: FormBuilder,
    private readonly recievableService: RecievableService,
    private readonly payableService: PayableService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.isSpinning = true;
    this.settingForm = this.formBuilder.group({
      bordered: false,
      loading: false,
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

    this.tForm = this.fb.group({
      newReciever: [null, [Validators.required]],
      item: [null, [Validators.required]],
      amount: [null, [Validators.required]]
    });

    this.fForm = this.fb.group({
      newReciever: [null, [Validators.required]],
      amount: [null, [Validators.required]]
    });
  }
}
