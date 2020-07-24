# Manual payment request

Redirect users to their DotWallet to confirm a payment.

- [Step 1: Merchant sends a payment request](#step1:merchant-sends-a-payment-request)
- [Step 2: User confirms payment in DotWallet](#step2:user-confirms-payment-in-dotwallet)
- [Query order status](#query-order-status)
- [Merchant signature](#merchant-signature)

## Step 1: Merchant creates a payment request

The merchant sends a request to the DotWallet API to create a payment order. This should be done from a backend server.

- **Address**: https://www.ddpurse.com/openapi/create_order
- **Method**: `POST`
- **Body params(JSON)**:

Parameter Description

| Param             | Required | Type   | Description                                                                                                    |
| ----------------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| app_id            | YES      | int    | Application ID                                                                                                 |
| merchant_order_sn | YES      | string | Order ID (recommended: UUID)                                                                                   |
| item_name         | YES      | string | Purchased item, product, or service name                                                                       |
| order_amount      | YES      | int    | Payment sum (unit: satoshis)                                                                                   |
| nonce_str         | YES      | string | Random nonce (recommended: timestamp) to prevent repeated orders                                               |
| sign              | YES      | string | Sign the order with merchant application secret key (see: "Merchant signature")                                |
| notice_uri        | NO       | string | Merchant provided server url for receiving payment result information (set to receive GET request with params) |
| redirect_uri      | NO       | string | Url to redirect the user to after payment completion                                                           |
| opreturn          | NO       | string | User provided custom OP_RETURN message/data (format: rawhex)                                                   |
| receive_address   | NO       | string | Receiving wallet address. If left empty will send to app developer's default wallet as per the app settings    |

> During development do not use `localhost` for `redirect_uri` or `notice_uri`. First find your local IP with the terminal command `ifconfig | grep netmask`. For example if it is `192.168.1.142` then you can put `http://192.168.1.142:3000`for the redirect. Remember to also go to the DotWallet for Developers Application Settings page, and register `192.168.1.142:3000`(no http) in the Callback domain field.

**example request**:

> See the bottom of this page for details on how to implement a DotWallet signature (examples in js and java)

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

> If not using the default, <font color=orange>receive_address</font> must be a **string** that is a **valid JSON array** of objects such as the following:

```json
[
  {
    "address": "1MS3HE9M3oEqW81KXp8iK9nBMTGXekdxAP",
    "amount": 622
  }
]
```

**Success**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "order_sn": "ORDER_SN"
  }
}
```

**Failure** example:

```json
{
  "code": 10107,
  "msg": "Order payment error,the current order number already exists ",
  "data": []
}
```

**Return params description**:

| Param    | Description                      |
| -------- | -------------------------------- |
| order_sn | DotWallet generated order number |

## Step 2: User confirms payment in DotWallet

**After successfully obtaining the order_sn, redirect the client to the DotWallet page for payment confirmation**

Desktop clients: redirect to the link below:

> https://www.ddpurse.com/desktop/open/pay?order_sn= <font color=orange>{order_sn}</font>

Mobile clients redirect to the link below:

> https://www.ddpurse.com/wallet/open/pay?order_sn=<font color=orange>{order_sn}</font>

The DotWallet payment confirmation page the user will be redirected to:
<img src="./example/03placeOrder.png" alt="03placeOrder" width="375"/>

- **Upon success or failure, the user willbe redirected to `redirect_uri`. On failure there will be no params. If the payment was successful, the following params will be appended**:

| Param               | Type   | Description                                                     |
| ------------------- | ------ | --------------------------------------------------------------- |
| app_id              | int    | Application ID                                                  |
| order_sn            | string | DotWallet generated order number from step 1                    |
| merchant_order_sn   | string | Merchant generated order ID from step 1                         |
| item_name           | string | Purchased item, product, or service name                        |
| receive_address     | string | Merchant's receiving address                                    |
| user_refund_address | string | User's refund address                                           |
| order_amount        | int    | Payment sum (unit: satoshis)                                    |
| pay_txid            | string | TXID (bitcoin transaction ID)                                   |
| status              | int    | Order status (0: awaiting payment, 9: paid, -1: payment failed) |
| nonce_str           | string | Random nonce from step 1                                        |
| sign                | string | Order signature                                                 |

## Query order status

- **Address**: https://www.ddpurse.com/platform/openapi/search_order/
- **Method**: `POST`

- **Body params(JSON)**:

| Param             | Required | Type   | Description                             |
| ----------------- | -------- | ------ | --------------------------------------- |
| app_id            | YES      | int    | Application ID                          |
| secret            | YES      | string | Application secret key                  |
| merchant_order_sn | YES      | string | Merchant generated order ID from step 1 |

**Success**:

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "merchant_order_sn": "m1001",
    "amount": 5668,
    "item_name": "A red apple",
    "receive_address": "Your BSV address",
    "pay_time": "2019-11-05 17:56:16",
    "order_sn": "1001",
    "status": 0,
    "create_time": "2019-11-05 17:55:16"
  }
}
```

**Failure** example:

```json
{
  "code": 10205,
  "msg": "Query order error,order not existed",
  "data": []
}
```

**Return params description**:

| Param               | Type     | Description                                                     |
| ------------------- | -------- | --------------------------------------------------------------- |
| merchant_order_sn   | string   | Merchant generated order ID from step 1                         |
| amount              | int      | Payment sum (unit: satoshis)                                    |
| item_name           | string   | Purchased item, product, or service name                        |
| receive_address     | string   | Merchant's receiving address                                    |
| user_refund_address | string   | User's refund address                                           |
| pay_time            | datetime | Order payment completion time timestamp                         |
| status              | int      | Order status (0: awaiting payment, 9: paid, -1: payment failed) |
| create_time         | datetime | Order creation time timestamp                                   |

**The DotWallet server will send the payment result to the merchant provided `notice_uri` in a GET request with the following params**

> Note: op_return data will not be included

| Param               | Type   | Description                                                     |
| ------------------- | ------ | --------------------------------------------------------------- |
| app_id              | int    | Global merchant ID                                              |
| order_sn            | string | DotWallet order number                                          |
| merchant_order_sn   | string | Merchant order number                                           |
| item_name           | string | Purchased item, product, or service name                        |
| receive_address     | string | Merchant's receiving address                                    |
| user_refund_address | string | User's refund address                                           |
| order_amount        | int    | Payment sum (unit: satoshis)                                    |
| pay_txid            | string | TXID                                                            |
| status              | int    | Order status (0: awaiting payment, 9: paid, -1: payment failed) |
| nonce_str           | string | Random nonce from step 1                                        |
| sign                | string | Order signature                                                 |

### Merchant signature

Real working code examples of how to cryptographically sign the order with the developer's application secret to generate the <font color=orange>sign</font> parameter in step 1

- **NodeJS**

> Pass in your application secret key as `secret`
> Pass in the order data from step 1 but the signature will ignore the `sign` and `opreturn` fields

```javascript
const md5 = require('md5');
const crypto = require('crypto');

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

> Pass in your application secret key as `secret`
> Pass in the order data from step 1 but ignore the `sign` and `opreturn` fields

```java
 protected String getSignature(Map<String, Object> orderData,String secret) {
        StringBuilder sb = new StringBuilder();
        String md5Secret = Md5Utils.encode(secret);

        for (Map.Entry entry : orderData.entrySet()) {
            String key = (String) entry.getKey();
            Object value = entry.getValue();

            if ("SIGN".equals(key.toUpperCase()) || "OPRETURN".equals(key.toUpperCase())) {
                continue;
            }

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

- **Test case**

  - Input

    ```js
    {
      "nonce_str": "1593312690806",
      "merchant_order_sn": "b023e54b-cfbe-4bc3-9444-5b7728e973a3",
      "order_amount": 10000,
      "sign": "",
      "notice_uri": "http://192.168.1.142:3000/payment-notice",
      "item_name": "A red apple",
      "opreturn": "This is a lovely apple",
      "redirect_uri": "http://192.168.1.142:3000/payment-success",
      "app_id": "5a192d599b0be66bdb2ef72784acb0f8",
      "receive_address": "[{"address":"1","amount":444},{"address":"2","amount":555},{"address":"3","amount":666}]"
    }, E9873D79C6D87DC0FB6A5778633389F4453213303DA61F20BD67FC233AA33262
    ```

  - Output
    `sign : b71557823ce2b25d07fb186368999181`
