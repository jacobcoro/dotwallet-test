const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const url = require('url');

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 3000;
const YOUR_APP_SECRET = process.env.APP_SECRET;
const YOUR_APP_ID = process.env.APP_ID;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('src'));

app.get('/auth', async (req, res) => {
  // console.log('req, res', req, res);
  try {
    const code = req.query.code;
    console.log('==============got code==============\n', code);
    const data = {
      app_id: YOUR_APP_ID,
      secret: YOUR_APP_SECRET,
      code: code,
    };
    console.log('==============data==============\n', data);

    const accessTokenRequest = await axios.post(
      'https://www.ddpurse.com/platform/openapi/access_token',
      data
    );
    console.log(
      '==============access token result==============\n',
      accessTokenRequest
    );
    const accessToken = accessTokenRequest.data.data.access_token;
    if (accessToken) {
      const userInfoRequest = await axios.get(
        'https://www.ddpurse.com/platform/openapi/get_user_info?access_token=' +
          accessToken
      );
      console.log(
        '==============user info result==============\n',
        userInfoRequest.data
      );
      res.redirect(
        url.format({
          pathname: '/restricted-page/',
          query: {
            name: userInfoRequest.data.data.user_name,
            pic: userInfoRequest.data.data.user_avatar,
          },
        })
      );
    }
  } catch (err) {
    console.log('==============ERROR==============\n', err);
  }
});

app.get('/restricted-page', async (req, res) => {
  res.sendFile(path.join(__dirname + '/restricted-page.html'));
});

/** Payment example: */
app.get('/store-front', async (req, res) => {
  res.sendFile(path.join(__dirname + '/store-front.html'));
});

app.post('/sign-payment-order', async (req, res) => {
  try {
    const orderData = req.body;
    console.log('==============orderData==============\n', orderData);
    responseJson = {
      ...orderData,
      sign: getSignature(orderData, YOUR_APP_SECRET),
    };
    console.log(responseJson);
    res.json({
      ...orderData,
      sign: getSignature(orderData, YOUR_APP_SECRET),
    });
    setTimeout(() => {
      orderStatus(orderData.merchant_order_sn);
    }, 1000 * 120);
  } catch (err) {
    console.log('==============err==============\n', err);
  }
});

const orderStatus = (merchant_order_sn) => {
  axios
    .post('https://www.dotwallet.com/platform/openapi/search_order', {
      app_id: YOUR_APP_ID,
      secret: YOUR_APP_SECRET,
      merchant_order_sn: merchant_order_sn,
    })
    .then((response) => {
      let orderStatus = response.json();
      console.log('==============orderStatus==============\n', orderStatus);
    });
};

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

app.listen(PORT, () =>
  console.log(`DotWallet example app listening at http://localhost:${PORT}`)
);
