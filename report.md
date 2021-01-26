# 环境
- ubuntu 20.04 64bit
- python sdk
- FISCO BCOS 2.0

# 语言
- Solidity
- python

# 项目设计说明
根据提供的供应链场景，基于FISCO-BCOS设计相关的智能合约并详细解释智能合约是如何解决提出的问题。
## 合约设计与实现
### 存储设计
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

### 接口设计
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
### 接口的具体实现
#### 功能零：注册登陆

##### 链端实现

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
##### 后端实现

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

#### 功能一：实现采购商品—签发应收账款交易上链

输入收款方地址，账款交易的商品和对应金额。记录到应收账款映射中，id自增。只有函数调用的来源地址为核心企业地址时，才能成功签发，且核心企业不能向自己签发应收账款。

##### 链端实现

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

##### 后端实现

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

#### 功能二：实现应收账款的转让上链

输入转让接收方地址，账款交易的商品和对应金额。分两种情况，部分转让和全部转让。全部转让直接更新金额足够的应收账款的`to`，`product`属性。部分转让需要拆分应收账款，原单据金额减少，并生成一个新的单据记录到应收账款映射中，id自增。当一个应收账款单据金额不够时，操作可能涉及多个应收账款单据。只有转让金额小于函数调用的来源地址拥有的未结算应收账款金额之和，才能成功转让，且不能转让给自己。

##### 链端实现

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

##### 后端实现

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



#### 功能三：利用应收账款向银行融资上链，供应链上所有可以利用应收账款单据向银行申请融资

类似转让。输入融资资金接收方地址和对应金额（商品默认为`money`）。分两种情况，部分融资和全部融资。全部融资直接更新金额足够的应收账款的`to`，`product`属性，将应收账款单据转让给银行。部分融资需要拆分应收账款，原单据金额减少，并生成一个新的单据记录到应收账款映射中，id自增。当一个应收账款单据金额不够时，操作可能涉及多个应收账款单据。只有融资金额小于函数调用的来源地址拥有的未结算已认证应收账款金额之和，才能成功融资，且单据转让方只能是企业（`type=false`），接收方只能是银行（`type=true`）。

##### 链端实现

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

##### 后端实现

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



#### 功能四：应收账款支付结算上链，应收账款单据到期时核心企业向下游企业支付相应的欠款

输入待结算的的应收账款编号，将对应应收账款的状态`status`属性设为已支付。相应地增减涉及实体的储蓄余额。只有函数调用的来源地址为核心企业地址时，才能进行该操作。

##### 链端实现

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
##### 后端实现

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



#### 辅助功能：第三方可信机构（金融机构）确认应收账款真实性

输入待确认的应收账款编号，将对应应收账款的`isconfirmed`属性设为true。只有金融机构（类型=true）可以对应收账款进行确认。

##### 链端实现

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
##### 后端实现

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

#### 后端辅助功能：查询账单和用户余额

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

  

# 功能测试文档

将智能合约部署至链上（单节点or多节点），并调用相关函数，详细说明上述的四个功能具体是如何实现的。（截图说明调用结果）

使用Remix IDE在本地进行智能合约的部署和调用

## 部署
![](./img/deploy.png)
![](./img/after_deploy.png)

## 函数调用
### 实体注册
注册轮胎公司、轮毂公司、银行实体并存储相关信息

```
核心企业(宝马):0x5B38Da6a701c568545dCfcB03FcB875f56beddC4

轮胎公司:0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2

轮毂公司:0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db

银行:0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB
```

![](./img/luntai.png)
![](./img/lungu.png)
![](./img/yinhang.png)

### 签发应收账款
核心企业宝马`0x5B38Da6a701c568545dCfcB03FcB875f56beddC4`向轮胎公司`0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2`采购`轮胎`，签订**1000**万的应收账款单据

![](./img/f_create.png)

查看应收账款数组中对应项

![](./img/f_create_detail.png)


### 确认应收账款真实性
第三方可信金融机构银行`0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB`确认以上创建的应收账款的真实性
![](./img/f_confirm.png)

再次查看应收账款数组中对应项，发现成员变量`isconfirmed`被设为`true`，表示已被确认为真实应收账款

![](./img/f_confirm_detail.png)

### 转让应收账款
轮胎公司`0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2`从轮毂公司`0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db`购买了一批`轮毂`，但由于租金暂时短缺向轮毂公司签订了**500**万的应收账款单据

![](./img/f_transfer.png)

查看应收账款数组中对应项，发现被拆分应收账款金额减少，并由于拆分应收账款生成了一个新的应收账款单据，新的单据继承了原单据的真实性

![](./img/f_transfer_detail_0.png)
![](./img/f_transfer_detail_1.png)

### 利用应收账款向银行融资
轮胎公司`0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2`因为资金短缺需要融资**100**万，这个时候它可以凭借跟某车企签订的应收账款单据向金融机构银行`0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB`借款，金融机构认可该车企（核心企业）的还款能力，因此愿意借款给轮胎公司。

首先可以看到轮胎公司融资前的储蓄余额为0

![](./img/f_financing_luntai_balance_before.png)

然后进行融资

![](./img/f_financing_luntai.png)

再次查看轮胎公司融资后储蓄余额为100

![](./img/f_financing_luntai_balance_after.png)

检查应收账款数组，发现轮胎公司持有的应收账款金额减少，并由于拆分应收账款生成了一个新的应收账款单据，融资单据货物为金钱。

![](./img/f_financing_luntai_detail_0.png)
![](./img/f_financing_luntai_detail_2.png)


实现了供应链信任关系向下传递，轮毂公司`0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db`也可以凭借应收账款单据向金融机构银行`0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB`借款**500**万。

首先查看轮毂公司融资前的储蓄余额,为0。

![](./img/f_financing_lungu_balance_before.png)

下面进行融资

![](./img/f_financing_lungu.png)

>这里两个错误控制
>1. **返回-2 -融资失败，融资金额超过拥有的最大金额（结算了的应收账款单据不能融资，只有认证了的应收账款单据才能融资）**，这里尝试借款`600`万。
>
>![](./img/f_financing_error_1.png)
>
>2. **返回-1 -融资失败，只能是企业向银行融资**，企业向企业融资
>
>![](./img/f_financing_error_2.png)


再次查看轮毂公司融资后储蓄余额,为500

![](./img/f_financing_lungu_balance_after.png)

检查应收账款数组，发现原本由轮胎公司持有的应收账款转移到银行名下，这是因为本次融资使用了该应收账款中的所有金额

![](./img/f_financing_lungu_detail_1.png)

### 应收账款支付结算

应收账款单据到期后，核心企业宝马`0x5B38Da6a701c568545dCfcB03FcB875f56beddC4`进行支付结算

结算应收账款0

结算前应收账款状态：

![](./img/settle_0_before.png)

结算前核心企业储蓄余额：

![](./img/settle_baoma_balance_before.png)

结算:

![](./img/f_settle.png)

结算后应收账款状态：

![](./img/settle_0_after.png)

结算后核心企业储蓄余额：

![](./img/settle_baoma_balance_after.png)


# 参考文献
- 智能合约 https://docs.soliditylang.org/en/v0.4.24/introduction-to-smart-contracts.html
- solidity https://docs.soliditylang.org/en/v0.4.24/solidity-by-example.html
- 构建区块链应用 https://fisco-bcos-documentation.readthedocs.io/zh_CN/latest/docs/tutorial/sdk_application.html
- remix
  - 在线编译器 https://remix.ethereum.org/#
  - 使用教程 https://remix-ide.readthedocs.io/en/latest/layout.html


