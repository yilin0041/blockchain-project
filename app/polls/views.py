
from django.shortcuts import render
#from django.contrib.auth.models import User
from polls.models import *
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate
from django.forms import model_to_dict
from django.db.models import Q
from pathlib import Path
import json
import os
import sys
import random
sys.path.append("static/python-sdk")
sys.path.append("static/python-sdk/client")
sys.path.append("static/python-sdk/bin")
sys.path.append("static/python-sdk/contracts")
from eth_utils import to_checksum_address
from eth_utils.hexadecimal import encode_hex
from eth_account.account import Account
from client.contractnote import ContractNote
from client.bcosclient import BcosClient
from client.stattool import StatTool
from client.datatype_parser import DatatypeParser
from client.common.compiler import Compiler
from client_config import client_config
from client.bcoserror import BcosException, BcosError
import traceback
rootDir="static/python-sdk/"
client = BcosClient()
print(client.getinfo())
if os.path.isfile(client_config.solc_path) or os.path.isfile(client_config.solcjs_path):
    #Compiler.compile_file("contracts/HelloWorld.sol")
    Compiler.compile_file(rootDir+"contracts/Supplychain.sol")
abi_file = rootDir+"contracts/Supplychain.abi"
data_parser = DatatypeParser()
data_parser.load_abi_file(abi_file)
contract_abi = data_parser.contract_abi
client = BcosClient()
info = client.getinfo()
print("client info:", info)
Contractaddr=ContractNote.get_last("Supplychain")
print(Contractaddr)
def createRandomString(len):
    print ('wet'.center(10,'*'))
    raw = ""
    range1 = range(58, 65) # between 0~9 and A~Z
    range2 = range(71, 97) # between A~Z and a~z

    i = 0
    while i < len:
        seed = random.randint(48, 102)
        if ((seed in range1) or (seed in range2)):
            continue
        raw += chr(seed)
        i += 1
    # print(raw)
    return raw
def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")

BASE_DIR = Path(__file__).resolve().parent.parent
def registerSuper(request):
    if request.method == 'POST':
        req=json.loads(request.body)
        with open(rootDir+"contracts/Supplychain.bin", 'r') as load_f:
            contract_bin = load_f.read()
            load_f.close()
        result = client.deploy(contract_bin)
        print("deploy", result)
        print("new address : ", result["contractAddress"])
        contract_name = req["name"]
        # 把部署结果存入文件备查
        ContractNote.save_address_to_contract_note(contract_name,
                                                result["contractAddress"])
        dic={}
        dic['state']="success"
        dic['address']= result["contractAddress"]
        return JsonResponse(dic)
    return HttpResponse("error!")
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