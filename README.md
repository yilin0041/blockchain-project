# 区块链金融系统

|   姓名   |   学号   |   分工   |
| :----: | :----: | :----: |
| 李佳 | 18342048 | 完成链端实现和部分实验报告 |
| 孙意林 | 18342088 | 完成后端实现和部分实验报告 |
| 彭炯雯 | 18342083 | 完成前端实现和部分实验报告 |

🔗 链接：
- [链端代码]()
- [后端代码](https://github.com/yilin0041/blockchain-project/tree/main/app)
- [前端代码](https://github.com/yilin0041/blockchain-project/tree/main/front-end)
- [视频演示](https://github.com/yilin0041/blockchain-project/tree/main/video)


# 部署方法

## 后端部署

首先，请按照app/static/python-sdk下的部署方法部署fisco的python-sdk服务。

配置完成后，请安装django环境（注意python版本要大于等于3.7）

```bash
pip install django
```

然后运行

```bash
python manage.py runserver 0.0.0.0:8000
```

按照提示安装缺失的文件。

当提示监听成功时，即部署完成。

如果链端编译失败，请在python-sdk文件夹下执行

```bash
./console.py deploy Supplychain save 
```

进行部署。<br/>

## 前端部署

> 请先确保您的运行环境已安装 node.js 、npm 和 Angular。

进入/front-end，首先运行
```bash
npm install -g --registry="https://registry.npm.taobao.org"
```
完成相关依赖的安装，然后运行
```bash
npm run start
```
开始编译，提示编译成功后即可通过 ``http://localhost:4200`` 访问。
