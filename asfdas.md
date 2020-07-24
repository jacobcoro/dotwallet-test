# 提交订单

用户可直接从开发者提交的域名跳转到打点钱包，提交订单

1. [第一步：商家跳转到打点钱包发起订单请求](#第一步：商家发起订单请求)
2. [第二步：用户跳转到打点钱包完成支付](#第二步：客户端跳转到打点钱包完成支付)
3. [查询订单状态](#查询订单状态)
4. [附：打点钱包加密签名算法](#附：打点钱包加密签名算法)

## 第一步：商家发起订单请求

商家跳转到打点钱包发起订单请求。最好从后端发起。

- **地址：**https://www.ddpurse.com/openapi/create_order
- **方式：`POST`**
- **Body 参数（JSON）：**

| 参数              | 是否必须 | 类型   | 说明                                                 |
| ----------------- | -------- | ------ | ---------------------------------------------------- |
| app_id            | 是       | int    | 商家应用账号                                         |
| merchant_order_sn | 是       | string | 商家订单号，随机字符串，建议使用 UUID                |
| item_name         | 是       | string | 商品名称                                             |
| order_amount      | 是       | int    | 订单金额，单位为 satoshi                             |
| nonce_str         | 是       | string | 随机字符串，建议为时间戳（毫秒为单位），避免重复交易 |
| sign              | 是       | string | 使用商家应用密钥`app_secret`进行加密签名，见附录     |
| notice_uri        | 否       | string | 支付结果服务器通知地址                               |
| redirect_uri      | 否       | string | 用户支付完成后的页面跳转地址                         |
| opreturn          | 否       | string | 用户自定义脚本的 rawhex                              |
| receive_address   | 否       | string | 收款地址，如果为否，则取 app 配置的收款地址          |

**请求例子**:

```js
const orderData = {
  app_id: '89d001043806644fdb4fb14099ff6be5', // replace with your app id
  merchant_order_sn: uuidv4(),
  item_name: 'bananas',
  order_amount: 546, // can't be lower than 546
  nonce_str: new Date().toString(),
  notice_uri: 'http://192.168.1.142:3000/payment-result', // replace 192.168.1.142 with your IP
  redirect_uri: 'http://192.168.1.142:3000/store-order-fulfilled', // replace 192.168.1.142 with your IP
  sign: getSignature(orderData, APP_SECRET),
};
axios.post('https://www.ddpurse.com/openapi/create_order', orderData);
```

> 注意：
>
> 1、 <font color=orange>{receive_address}</font> 为 JSON**字符串**,例：
>
> `"[{"address": "address1","amount": 622},{"address": "address2","amount":33}]"`
>
> 2、打点钱包加密签名<font color=orange>{sign}</font>算法在附录
>
> 3、当地开发的话 redirect_uri 和 notice_uri 不要用 localhost，可以先用`ifconfig | grep netmask`找到你的本地 IP，例如`192.168.1.142`然后这里输入`http://192.168.1.142:3000`。记得在我们开房平台的应用设置页面注册这个回调地址，注册时候不要用 http，直接是`192.168.1.142:3000`。

- **成功**

> 错误码 `code` 为 0 时表示成功

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "order_sn": "ORDER_SN"
  }
}
```

- **失败**

```json
{
  "code": 10107,
  "msg": "订单支付错误，当前订单号已经存在，错误码:10107",
  "data": []
}
```

- **返回参数说明**

| 参数     | 类型   | 说明             |
| -------- | ------ | ---------------- |
| order_sn | string | 打点钱包的订单号 |

## 第二步：客户端跳转到打点钱包完成支付

- **成功获取 `order_sn` 后，客户端跳转到打点钱包进行支付**

​ 桌面端请跳转到

> https://www.ddpurse.com/desktop/open/pay?order_sn= <font color=orange>{order_sn}</font>

​ 移动端请跳转到

> https://www.ddpurse.com/wallet/open/pay?order_sn=<font color=orange>{order_sn}</font>

打点钱包的支付页面：

<img src="./example/03placeOrder.png" alt="03placeOrder" width="375"/>

- **用户支付或取消订单，将会跳转到<font color=orange>{redirect_uri}</font>，如果取消或者没成功这个跳转不会附带任何参数，如果成功会附带以下的参数**

| 参数名              | 类型   | 说明                                                       |
| ------------------- | ------ | ---------------------------------------------------------- |
| app_id              | int    | 商家 app_id                                                |
| order_sn            | string | 打点钱包的订单号                                           |
| merchant_order_sn   | string | 商家订单号                                                 |
| item_name           | string | 购买商品名                                                 |
| receive_address     | string | 收款地址                                                   |
| user_refund_address | string | 用户的退款地址                                             |
| order_amount        | int    | 支付金额，单位为 satoshi                                   |
| pay_txid            | string | 支付交易 ID，TXID                                          |
| status              | int    | 订单状态，0 默认状态，1 支付成功，-1 取消支付，-2 支付失败 |
| nonce_str           | string | 随机字串                                                   |
| sign                | string | 签名                                                       |

## 查询订单状态

- **地址：**https://www.ddpurse.com/platform/openapi/search_order/
- **方式：`POST`**
- **Body 参数（JSON）：**

| 参数              | 是否必须 | 类型   | 说明         |
| ----------------- | -------- | ------ | ------------ |
| app_id            | 是       | int    | 商家应用账号 |
| secret            | 是       | string | 商家应用密钥 |
| merchant_order_sn | 是       | string | 商家订单号   |

- **成功**

> 错误码 `code` 为 0 时表示成功

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "merchant_order_sn": "m1001",
    "amount": 5668,
    "item_name": "测试下单支付商品",
    "receive_address": "Your BSV address",
    "pay_time": "2019-11-05 17:56:16",
    "order_sn": "1001",
    "status": 0,
    "create_time": "2019-11-05 17:55:16"
  }
}
```

- **失败**

```json
{
  "code": 10205,
  "msg": "查询订单错误, 订单信息不存在，错误码:10205",
  "data": []
}
```

- **返回参数说明**

| 参数                | 类型     | 说明                                            |
| ------------------- | -------- | ----------------------------------------------- |
| merchant_order_sn   | string   | 商家订单号                                      |
| amount              | int      | 订单金额，单位为 satoshi                        |
| item_name           | string   | 购买商品名称                                    |
| receive_address     | string   | 商家收款地址                                    |
| user_refund_address | string   | 用户的退款地址                                  |
| pay_time            | datetime | 订单支付时间                                    |
| status              | int      | 订单状态，0 为待支付，9 为已支付，-1 为支付失败 |
| create_time         | datetime | 订单创建时间                                    |

- **打点钱包服务端也会向商家提交的`notice_uri`通知商家订单支付结果**

> GET 请求，参数中没有`opreturn`

| 参数名              | 类型   | 说明                                                       |
| ------------------- | ------ | ---------------------------------------------------------- |
| app_id              | int    | 商家 app_id                                                |
| order_sn            | string | 打点钱包的订单号                                           |
| merchant_order_sn   | string | 商家订单号                                                 |
| item_name           | string | 购买商品名                                                 |
| receive_address     | string | 收款地址                                                   |
| user_refund_address | string | 用户的退款地址                                             |
| order_amount        | int    | 支付金额                                                   |
| pay_txid            | string | 支付 TXID                                                  |
| status              | int    | 订单状态，0 默认状态，1 支付成功，-1 取消支付，-2 支付失败 |
| nonce_str           | string | 随机字串                                                   |
| sign                | string | 签名                                                       |

## 附：商家签名算法

商家使用应用密钥`app_secret`生成加密签名`sign`

实例代码：

> `orderData`为第一步中的订单数据，但是要忽略`sign`与`opreturn`字段

- **NodeJS**

```javascript
const md5 = require('md5');
const crypto = require('crypto');

// 将请求的参数传入
function getSignature(orderData, appSecret) {
  let str = '';
  const secret = md5(appSecret);

  for (let key in orderData) {
    if (key != 'sign' || key != 'opreturn') {
      if (str) {
        str += '&' + key + '=' + orderData[key];
      } else {
        str = key + '=' + orderData[key];
      }
    }
  }

  str += '&secret=' + secret;
  str = str.toUpperCase();

  const sign = crypto
    .createHmac('sha256', secret)
    .update(str, 'utf8')
    .digest('hex');

  return sign;
}
```

- **Java**

```java
 protected String createSignature(Map<String, Object> orderData,String secret) {
        StringBuilder sb = new StringBuilder();
        String md5Secret = Md5Utils.encode(secret);

        for (Map.Entry entry : orderData.entrySet()) {
            String key = (String) entry.getKey();
            Object value = entry.getValue();

            if ("SIGN".equals(key.toUpperCase()) || "OPRETURN".equals(key.toUpperCase())) {
                continue;
            }
						//receive_address是一个地址的List，需要将List转成JSON String
            if (value instanceof List) {
                sb.append(key + "=" + JSON.toJSONString(value) + "&");
            } else {
                sb.append(key + "=" + (value + "") + "&");
            }
        }
        sb.append("secret=" + md5Secret);
        return Sha256Util.hmacSha256(sb.toString().toUpperCase(), md5Secret);
    }
```

- **测试用例**

  - 输入

    ```json
    {
      "nonce_str": "1593312690806",
      "merchant_order_sn": "b023e54b-cfbe-4bc3-9444-5b7728e973a3",
      "order_amount": 10000,
      "sign": "",
      "notice_uri": "http://192.168.1.142:3000/payment-notice",
      "item_name": "商品名称:一个苹果",
      "opreturn": "这是一笔普通订单,购买了一个苹果",
      "redirect_uri": "http://192.168.1.142:3000/payment-success",
      "app_id": "5a192d599b0be66bdb2ef72784acb0f8",
      "receive_address": "[{"address":"1","amount":444}, {"address":"2","amount":555},{"address":"3","amount":666}]"
    }
    ```

  - 输出

    `sign : b71557823ce2b25d07fb186368999181`
