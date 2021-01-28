# 环境
- ubuntu 20.04 64bit
- python sdk
- FISCO BCOS 2.0

# 语言
- Solidity
- python

# 方案设计
根据提供的供应链场景，基于FISCO-BCOS设计相关的智能合约并详细解释智能合约是如何解决提出的问题。
## 存储设计
定义结构体`receivable`用于记录应收账款详情，结构体`Entity`用于记录节点的基本信息，`receivables_id`为账单的id（自增，相当于账单数），`kernelCompany`记录核心企业address。
一个从id到应收账款详情的映射`receivables`，一个从地址到储蓄余额的映射`balances`，一个从地址到实体详情的映射`entitys`。

存储设计代码如下：
```js
enum RStatus { created, paid }
struct receivable{
    address from;//欠款方
    address to;//收款方
    string product;//产品或金钱
    uint amount;//金额
    RStatus status;//应收账款状态    
    bool isconfirmed;//是否经第三方可信机构认证
}

struct Entity{
    string name;
    bool etype;//(0-企业；1-金融机构)
    bool isUsed;
}

uint public receivables_id = 0;
uint[] rindex;
address public kernelCompany;  //核心企业，有签发应收账款的权限

//应收账款
mapping (uint => receivable ) public receivables; 
//实体储蓄余额
mapping (address => uint) public balances;
//实体详情
mapping (address => Entity) public entitys;
    
```

## 接口设计
- `register`
    * 功能：用于注册地址
    * 所需参数：实体地址，实体名，实体类型
    * 结果：0代表成功，1代表失败
- `create`
    * 功能：签发应收账款单据
    * 所需参数：收款方，商品，金额
    * 结果：0代表签发成功；-1代表签发失败，因为签发单位不是核心企业；-2代表签发失败，因为欠款和收款方不能是同一个实体
- `tansfer`
    * 功能：转让（部分或全部）应收账款单据
    * 所需参数：收款方，单据接收方，商品，金额
    * 结果：0代表转让成功；-1代表转让失败，因为只能是企业向银行融资；-2代表转让失败，因为转让金额超过拥有的最大金额（结算了的应收账款单据不能转让）
- `financing`
    * 功能：用于利用应收账款向银行融资
    * 所需参数：收款方，金额
    * 结果：0代表融资成功；-1代表融资失败，因为不能转让给自己；-2代表融资失败，因为融资金额超过拥有的最大金额（结算了的应收账款单据不能融资，只有认证了的应收账款单据才能融资）
- `settle`
    * 功能：应收账款支付结算
    * 所需参数：结算账款的编号
    * 结果：0代表结算成功，1代表结算失败，因为只有核心企业能支付结算
- `confirm`
    * 功能：用于第三方可信机构（金融机构）确认应收账款真实性
    * 所需参数：确认账款的编号
    * 结果：0代表确认成功，1代表确认失败，因为只有金融机构能确认

接口的定义代码如下：
```js
function register(address _entity,string _name,bool _etype) public returns (int256)

function create(address _to, string memory _product,uint _amount) public returns(int256)

function tansfer(address new_to, string memory _product, uint _amount) public returns(int256)

function financing(address new_to, uint _amount) public returns(int256)

function settle(uint  r_id) public returns(int256)

function confirm(uint  r_id) public returns(int256)
```
## 核心功能介绍
### 功能零：注册登陆

#### 链端实现

将实体地址与详情结构体绑定起来，标记映射中该地址key为已用。为金融机构初始化储蓄余额**1000000**。如果地址已被使用，不能成功注册。
```js
/*
描述 : 注册
参数 ：
        _entity : 实体地址
        _name: 实体名
        _etype : 实体类型

返回值：
        0 -注册成功
        -1 -注册失败，地址已被使用
*/
function register(address _entity,string _name,bool _etype) public returns (int256){
    if(entitys[_entity].isUsed){
        return -1;
    }
    entitys[_entity].name=_name;
    entitys[_entity].etype=_etype;
    entitys[_entity].isUsed=true;
    if(_etype){
        balances[_entity]=1000000;
    }
    else{
        balances[_entity]=0;
    }
    return 0;
}
```
#### 后端实现

- 注册

```python
def register(request):
  if request.method == 'POST':
    req=json.loads(request.body)
    name=req["name"]
    password=req["pwd"]
    #生成地址
    ac = Account.create(password)
    print("new address :\t", ac.address)
    print("new privkey :\t", encode_hex(ac.key))
    print("new pubkey :\t", ac.publickey)

    kf = Account.encrypt(ac.privateKey, password)
    keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, name)
    print("save to file : [{}]".format(keyfile))
    with open(keyfile, "w") as dump_f:
        json.dump(kf, dump_f)
        dump_f.close()
    print("INFO >> Read [{}] again after new account,address & keys in file:".format(keyfile))
    with open(keyfile, "r") as dump_f:
        keytext = json.load(dump_f)
        privkey = Account.decrypt(keytext, password)
        ac2 = Account.from_key(privkey)
        print("address:\t", ac2.address)
        print("privkey:\t", encode_hex(ac2.key))
        print("pubkey :\t", ac2.publickey)
        print("\naccount store in file: [{}]".format(keyfile))
        dump_f.close()
    #调用函数
    args = [ac2.address, req["name"], req["type"]]
    receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "register", args)
    print("receipt:", receipt)
    #调用成功
    if(receipt['output']=="0x0000000000000000000000000000000000000000000000000000000000000000"):
        dic={}
        dic['state']="success"
        dic['address']= ac2.address
        return JsonResponse(dic)
    return HttpResponse("error!")
```

- 登陆

  ```python
  def login(request):
      req=json.loads(request.body)
      name=req["name"]
      password=req["pwd"]
      keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, name)
      #if the account doesn't exists
      dic={}
      if os.path.exists(keyfile) is False:
          dic['state']="no_user"
      else:
          print("name : {}, keyfile:{} ,password {}  ".format(name, keyfile, password))
          try:
              with open(keyfile, "r") as dump_f:
                  keytext = json.load(dump_f)
                  privkey = Account.decrypt(keytext, password)
                  ac2 = Account.from_key(privkey)
                  print("address:\t", ac2.address)
                  print("privkey:\t", encode_hex(ac2.key))
                  print("pubkey :\t", ac2.publickey)
                  client_config.account_keyfile=name+".keystore"
                  client_config.account_password=password
                  dic={}
                  dic['state']="success"
                  dic['address']= ac2.address
                  return JsonResponse(dic)
          except Exception as e:
              dic['state']= "pwd_error"
     return JsonResponse(dic)
  ```

### 功能一：实现采购商品—签发应收账款交易上链

输入收款方地址，账款交易的商品和对应金额。记录到应收账款映射中，id自增。只有函数调用的来源地址为核心企业地址时，才能成功签发，且核心企业不能向自己签发应收账款。

#### 链端实现

```js
/*
描述 : 签发应收账款单据 
参数 ：
        _to : 收款方
        _product: 商品
        _amount : 金额

返回值：
        0 -签发成功
        -1 -签发失败，签发单位不是核心企业
        -2 -签发失败，欠款和收款方不能是同一个实体
*/
function create(address _to, string memory _product,uint _amount) public returns(int256){
    address _from = msg.sender;
    if (_from != kernelCompany) return -1;
    if (_from == _to)return -2;
    uint rid=receivables_id++;
    receivables[rid]=receivable({
        from :_from,
        to :_to,//收款方
        product:_product,//产品或金钱
        amount:_amount,//金额
        status:RStatus.created,//应收账款状态    
        isconfirmed:false//是否经第三方可信机构认证
    });
    return 0;
}
```

#### 后端实现

```python
def create(request):
  if request.method == 'POST':
    req=json.loads(request.body)
    #调用函数
    keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, req["to"])
    dic={}
    if os.path.exists(keyfile) is False:
        dic['state']="no_user"
    else:
        with open(keyfile, "r") as dump_f:
            keytext = json.load(dump_f)
            print("address:\t", keytext["address"])
        args = [to_checksum_address(keytext["address"]), req["product"], req["amount"]]
        receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "create", args)
        print("receipt:", receipt)
        #调用成功
        txhash = receipt['transactionHash']
        txresponse = client.getTransactionByHash(txhash)
        inputresult = data_parser.parse_transaction_input(txresponse['input'])
        outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
        print(outputresult)
        if(outputresult[0]==-1):
            dic['state']="error(-1)"
        elif(outputresult[0]==-2):
            dic['state']="error(-2)"
        else:
            dic['state']="success"
        dic['data']=outputresult
    return JsonResponse(dic)
```

### 功能二：实现应收账款的转让上链

输入转让接收方地址，账款交易的商品和对应金额。分两种情况，部分转让和全部转让。全部转让直接更新金额足够的应收账款的`to`，`product`属性。部分转让需要拆分应收账款，原单据金额减少，并生成一个新的单据记录到应收账款映射中，id自增。当一个应收账款单据金额不够时，操作可能涉及多个应收账款单据。只有转让金额小于函数调用的来源地址拥有的未结算应收账款金额之和，才能成功转让，且不能转让给自己。

#### 链端实现

```js
/*
描述 : 转让（部分或全部）应收账款单据 
参数 ：
        new_to : 单据接收方
        _product: 商品
        _amount : 金额

返回值：
        0 -转让成功
        -1 -转让失败，不能转让给自己
        -2 -转让失败，转让金额超过拥有的最大金额（结算了的应收账款单据不能转让）
*/
function tansfer(address new_to, string memory _product, uint _amount) public returns(int256){
    address _to = msg.sender;//单据持有方发起转让
    //计算函数调用的来源地址拥有的未结算应收账款金额之和
    uint allamount = 0;
    //清空rindex数组，用于记录函数调用的来源地址拥有的未结算应收账款id
    rindex.length=0;
    //不能转让给自己
    if (_to == new_to)return -1;
    for(uint i=0;i<receivables_id;i++){
        //对函数调用的来源地址拥有的未结算应收账款进行操作
        if(receivables[i].to==_to && receivables[i].status!=RStatus.paid){
            //涉及单个应收账款单据
            if(receivables[i].amount>=_amount){
                receivables[i].amount-=_amount;
                //全部转让，转让单据
                if(receivables[i].amount==0){
                    receivables[i].amount=_amount;
                    receivables[i].to=new_to;
                    receivables[i].product=_product;
                    return 0;
                }
                //部分转让，拆分单据
                else{
                    uint rid=receivables_id++;
                    receivables[rid]=receivable({
                        from :receivables[i].from,
                        to :new_to,//收款方
                        product:_product,//产品或金钱
                        amount:_amount,//金额
                        status:RStatus.created,//应收账款状态    
                        isconfirmed:receivables[i].isconfirmed//是否经第三方可信机构认证
                    });
                    return 0;
                }
                
            }
            //计算函数调用的来源地址拥有的未结算应收账款金额之和，超过所需金额则停止计算，存储涉及的id
            else{
                allamount+=receivables[i].amount;
                rindex.push(i);
                if(allamount>=_amount)break;
            }
        }
    }
    //涉及多个应收账款单据
    if(allamount>=_amount){
        //遍历rindex表，处理相应id的应收账款单据
        for(uint j = 0; j < rindex.length; j++){
            //全部转让，转让单据
            if(_amount>=receivables[rindex[j]].amount){
                receivables[rindex[j]].to=new_to;
                receivables[rindex[j]].product=_product;
                _amount-=receivables[rindex[j]].amount;
                if(j==rindex.length-1)return 0;
            }
            //部分转让，拆分单据
            else{
                receivables[rindex[j]].amount-=_amount;
                uint rid_t=receivables_id++;
                receivables[rid_t]=receivable({
                    from :receivables[rindex[j]].from,
                    to :new_to,//收款方
                    product:_product,//产品或金钱
                    amount:_amount,//金额
                    status:RStatus.created,//应收账款状态    
                    isconfirmed:receivables[rindex[j]].isconfirmed//是否经第三方可信机构认证
                });
                return 0;
            }    
        }
    }
    //转让金额超过拥有的最大金额
    else return -2;
}
```

#### 后端实现

```python
def transfer(request):
  if request.method == 'POST':
    print("now account is : "+client_config.account_keyfile)
    print("now account password is : "+client_config.account_password)
    req=json.loads(request.body)
    #调用函数
    keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, req["new_to"])
    dic={}
    if os.path.exists(keyfile) is False:
        dic['state']="no_user"
    else:
        with open(keyfile, "r") as dump_f:
            keytext = json.load(dump_f)
            print("address:\t", keytext["address"])
        args = [to_checksum_address(keytext["address"]),req["product"],req["amount"]]
        receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "tansfer", args)
        print("receipt:", receipt)
        #调用成功
        txhash = receipt['transactionHash']
        txresponse = client.getTransactionByHash(txhash)
        inputresult = data_parser.parse_transaction_input(txresponse['input'])
        outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
        print(outputresult)
        if(outputresult[0]==-1):
            dic['state']="error(-1)"
        elif(outputresult[0]==-2):
            dic['state']="error(-2)"
        else:
            dic['state']="success"
        dic['data']=outputresult
    return JsonResponse(dic)
```



### 功能三：利用应收账款向银行融资上链，供应链上所有可以利用应收账款单据向银行申请融资

类似转让。输入融资资金接收方地址和对应金额（商品默认为`money`）。分两种情况，部分融资和全部融资。全部融资直接更新金额足够的应收账款的`to`，`product`属性，将应收账款单据转让给银行。部分融资需要拆分应收账款，原单据金额减少，并生成一个新的单据记录到应收账款映射中，id自增。当一个应收账款单据金额不够时，操作可能涉及多个应收账款单据。只有融资金额小于函数调用的来源地址拥有的未结算已认证应收账款金额之和，才能成功融资，且单据转让方只能是企业（`type=false`），接收方只能是银行（`type=true`）。

#### 链端实现

```js
/*
描述 : 利用应收账款向银行融资
参数 ：
        new_to : 单据接收方
        _amount : 金额

返回值：
        0 -融资成功
        -1 -融资失败，只能是企业向银行融资
        -2 -融资失败，融资金额超过拥有的最大金额（结算了的应收账款单据不能融资，只有认证了的应收账款单据才能融资）
*/
function financing(address new_to, uint _amount) public returns(int256){
    address _to = msg.sender;//单据持有方发起融资
    //计算函数调用的来源地址拥有的未结算已认证应收账款金额之和
    uint allamount = 0;
    //清空rindex数组，用于记录函数调用的来源地址拥有的未结算已认证应收账款id
    rindex.length = 0;
    //只能是企业向银行融资
    if (entitys[_to].etype || !entitys[new_to].etype)return -1;
    for(uint i=0;i<receivables_id;i++){
        //对函数调用的来源地址拥有的未结算已认证应收账款进行操作
        if(receivables[i].to==_to && receivables[i].status!=RStatus.paid&&receivables[i].isconfirmed){
            //涉及单个应收账款单据
            if(receivables[i].amount>=_amount){
                receivables[i].amount-=_amount;
                //全部融资，转让单据
                if(receivables[i].amount==0){
                    receivables[i].amount=_amount;
                    receivables[i].to=new_to;
                    receivables[i].product="money";
                    balances[_to] += _amount;
                    balances[new_to] -= _amount;
                    return 0;
                }
                //部分融资，拆分单据
                else{
                    uint rid=receivables_id++;
                    receivables[rid]=receivable({
                        from :receivables[i].from,
                        to :new_to,//收款方
                        product:"money",//产品或金钱
                        amount:_amount,//金额
                        status:RStatus.created,//应收账款状态    
                        isconfirmed:receivables[i].isconfirmed//是否经第三方可信机构认证
                    });
                    //储蓄金额转入和转出
                    balances[_to] += _amount;
                    balances[new_to] -= _amount;
                    return 0;
                }
            }
            //计算函数调用的来源地址拥有的未结算已认证应收账款金额之和，超过所需金额则停止计算，存储涉及的id
            else{
                allamount+=receivables[i].amount;
                rindex.push(i);
                if(allamount>=_amount)break;
            }
        }
    }
    //涉及多个应收账款单据
    if(allamount>=_amount){
        //储蓄金额转入和转出
        balances[new_to] -= _amount;
        balances[_to] += _amount;
        //遍历rindex表，处理相应id的应收账款单据
        for(uint j = 0; j < rindex.length; j++){
            //全部融资，转让单据
            if(_amount>=receivables[rindex[j]].amount){
                receivables[rindex[j]].to=new_to;
                receivables[rindex[j]].product="money";
                _amount-=receivables[rindex[j]].amount;
                if(j==rindex.length-1)return 0;
            }
            //部分融资，拆分单据
            else{
                receivables[rindex[j]].amount-=_amount;
                uint rid_t=receivables_id++;
                receivables[rid_t]=receivable({
                    from :receivables[rindex[j]].from,
                    to :new_to,//收款方
                    product:"money",//产品或金钱
                    amount:_amount,//金额
                    status:RStatus.created,//应收账款状态    
                    isconfirmed:receivables[rindex[j]].isconfirmed//是否经第三方可信机构认证
                });
                return 0;
            }    
        }
    }
    //融资金额超过拥有的最大金额
    else return -2;
}
```

#### 后端实现

```python
def financing(request):
  if request.method == 'POST':
    print("now account is : "+client_config.account_keyfile)
    print("now account password is : "+client_config.account_password)
    req=json.loads(request.body)
    #调用函数
    keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, req["new_to"])
    dic={}
    if os.path.exists(keyfile) is False:
        dic['state']="no_user"
    else:
        with open(keyfile, "r") as dump_f:
            keytext = json.load(dump_f)
            print("address:\t", keytext["address"])
        args = [to_checksum_address(keytext["address"]),req["amount"]]
        receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "financing", args)
        print("receipt:", receipt)
        #调用成功
        txhash = receipt['transactionHash']
        txresponse = client.getTransactionByHash(txhash)
        inputresult = data_parser.parse_transaction_input(txresponse['input'])
        outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
        print(outputresult)
        if(outputresult[0]==-1):
            dic['state']="error(-1)"
        elif(outputresult[0]==-2):
            dic['state']="error(-2)"
        else:
            dic['state']="success"
        dic['data']=outputresult
    return JsonResponse(dic)
```



### 功能四：应收账款支付结算上链，应收账款单据到期时核心企业向下游企业支付相应的欠款

输入待结算的的应收账款编号，将对应应收账款的状态`status`属性设为已支付。相应地增减涉及实体的储蓄余额。只有函数调用的来源地址为核心企业地址时，才能进行该操作。

#### 链端实现

```js
/*
描述 : 应收账款支付结算
参数 ：
        r_id : 结算账款的编号

返回值：
        0 -结算成功
        -1 -结算失败，只有核心企业能支付结算
*/
function settle(uint  r_id) public returns(int256){
    address cur = msg.sender;
    if(cur != kernelCompany) return -1;
    receivables[r_id].status=RStatus.paid;
    balances[cur] -= receivables[r_id].amount;
    balances[receivables[r_id].to] += receivables[r_id].amount;
    return 0;
}
```
#### 后端实现

```python
def settle(request):
  if request.method == 'POST':
    print("now account is : "+client_config.account_keyfile)
    print("now account password is : "+client_config.account_password)
    req=json.loads(request.body)
    #调用函数
    args = [req["r_id"]]

    receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "settle", args)
    print("receipt:", receipt)
    #调用成功
    txhash = receipt['transactionHash']
    txresponse = client.getTransactionByHash(txhash)
    inputresult = data_parser.parse_transaction_input(txresponse['input'])
    outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
    print(outputresult)
    dic={}
    dic['state']=outputresult[0]
    return JsonResponse(dic)
```



### 辅助功能：第三方可信机构（金融机构）确认应收账款真实性

输入待确认的应收账款编号，将对应应收账款的`isconfirmed`属性设为true。只有金融机构（类型=true）可以对应收账款进行确认。

#### 链端实现

```js
/*
描述 : 第三方可信机构（金融机构）确认应收账款真实性
参数 ：
        r_id : 确认账款的编号

返回值：
        0 -确认成功
        -1 -确认失败，只有金融机构能确认
*/
function confirm(uint  r_id) public returns(int256){
    address cur = msg.sender;
    if(!entitys[cur].etype) return -1;
    receivables[r_id].isconfirmed=true;
    return 0;
}
```
#### 后端实现

```python
def confirm(request):
  if request.method == 'POST':
    print("now account is : "+client_config.account_keyfile)
    print("now account password is : "+client_config.account_password)
    req=json.loads(request.body)
    #调用函数
    args = [req["r_id"]]

    receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "confirm", args)
    print("receipt:", receipt)
    #调用成功
    txhash = receipt['transactionHash']
    txresponse = client.getTransactionByHash(txhash)
    inputresult = data_parser.parse_transaction_input(txresponse['input'])
    outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
    print(outputresult)
    dic={}
    dic['state']=outputresult[0]
    return JsonResponse(dic)
```

### 后端辅助功能：查询账单和用户余额

- 查询账单

  ```python
  def find(request):
    if request.method == 'POST':
      print("now account is : "+client_config.account_keyfile)
      print("now account password is : "+client_config.account_password)
      req=json.loads(request.body)
      #调用函数
      args = [req["r_id"]]
  
      receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "receivables", args)
      print("receipt:", receipt)
      #调用成功
      txhash = receipt['transactionHash']
      txresponse = client.getTransactionByHash(txhash)
      inputresult = data_parser.parse_transaction_input(txresponse['input'])
      outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
      print(outputresult)
      dic={}
      dic['state']="success"
      dic['data']=outputresult
      return JsonResponse(dic)
  ```

- 查询余额

  ```python
  def balance(request):
    if request.method == 'POST':
      print("now account is : "+client_config.account_keyfile)
      print("now account password is : "+client_config.account_password)
      req=json.loads(request.body)
      #调用函数
      keyfile = "{}/{}.keystore".format(client_config.account_keyfile_path, req["name"])
      dic={}
      if os.path.exists(keyfile) is False :
          dic['state']="no_user"
      else:
          with open(keyfile, "r") as dump_f:
              keytext = json.load(dump_f)
              print("address:\t", keytext["address"])
          args = [to_checksum_address(keytext["address"])]
          receipt = client.sendRawTransactionGetReceipt(Contractaddr, contract_abi, "balances", args)
          print("receipt:", receipt)
          #调用成功
          txhash = receipt['transactionHash']
          txresponse = client.getTransactionByHash(txhash)
          inputresult = data_parser.parse_transaction_input(txresponse['input'])
          outputresult = data_parser.parse_receipt_output(inputresult['name'], receipt['output'])
          print(outputresult)
          dic={}
          dic['state']="success"
          dic['data']=outputresult
      return JsonResponse(dic)
  ```

  

# 功能测试

# 界面展示

# 心得体会
## 链端实现【18342048李佳】

本次项目实现了基于区块链的供应链金融平台，该平台连接与服务供应链业务交易各方，增强数据链接和共享，提升供应链各方协同性，提高业务处理效率，确定底层资产交易的真实性，为交易各方提供信任和信用的基石。平台底层基于已有的开源区块链系统FISCO-BCOS，充分利用区块链技术的不可篡改、共识机制、分布存储等技术特点，为企业融资提供信任和信用的技术基础。采用联盟链技术构建供应链参与企业间的全新可信机制，实现了融资前后各项数据的有效监管，合理控制金融风险；去中心化的存储机制，并通过公式协议实现数据同步，解决电子数据容易复制和修改的问题，使数据难以被篡改；编写隐私智能合约，增加数据保护能力，保障供应链业务数据完整性的同时，确保交易双方敏感信息的隐私性；使用统一的数据模型，解决各类供应链金融业务场景下数据不统一的问题，增强整个系统的快速扩展性。  
首次使用solidity编写智能合约，了解了区块链的底层机制，明白了区块链的去中心化,防篡改,开放性,匿名性以及可追溯性等特点的优越性和结合现实需求落地应用的方式。

## 后端实现【18342088孙意林】

本次大作业利用fisco实现了一个简单的金融系统。本次我主要负责的是后端的部分。后端主要使用了python-sdk和Django的框架进行编写。首先python-sdk是fisco提供的sdk代码，其中还有一点会和Django架构发生冲突的地方都已经被修改，整体架构还是没有变化的，将其嵌入到Django中，作为一个脚本代码运行。python-sdk在使用的时候可能会出现卡顿的情况，测试后发现应该是由于链端部署在公网，所以数据传输比较慢导致的。整体来看，python-sdk还是比较友好的，封装了很多比较便捷的操作。创建用户开始的时候我使用的是通过底层自己慢慢创建，后来发现，sdk中已经有封装好的方法可以自动创建一个加密账户。同时，可以根据密码来对账户信息进行加密。这样，就可以对链端的注册信息进行保护。只有用户正确输入用户名和密码，才能拿到用户相关信息进行与链端的交互。另外，在其它具体操作，如创建交易等，让前端显示地址直接进行交互十分不友好，可以利用用户名来代替地址的作用。前端传回有关的用户名，后端通过用户文件解析出用户地址，再通过这个地址进行与链端的交互。这样会大大增加便利性。

总的来说，通过本次大项目，我不仅对fisco区块链的知识有了更深的了解，更通过一个具体的实例，加深了对其的实用性的理解。通过使用后端与链端的交互，也让我对如何使用区块链、如何使用我们平常熟悉的语言来调用区块链有了实践性的认知。使用python调用区块链虽然不如java有更加直观的教程等，但是通过阅读源码来找自己想要的功能，可以让自己对区块链底层有更加深刻的认识。最后，通过这个大项目，也让我对一学期学过的区块链内容有了一个实践性的总结，让我对区块链又了更深的理解与应用基础。

# 参考文献
- 智能合约 https://docs.soliditylang.org/en/v0.4.24/introduction-to-smart-contracts.html
- solidity https://docs.soliditylang.org/en/v0.4.24/solidity-by-example.html
- 构建区块链应用 https://fisco-bcos-documentation.readthedocs.io/zh_CN/latest/docs/tutorial/sdk_application.html
- remix
  - 在线编译器 https://remix.ethereum.org/#
  - 使用教程 https://remix-ide.readthedocs.io/en/latest/layout.html
- python-sdk https://github.com/FISCO-BCOS/python-sdk


