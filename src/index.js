const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const app = express();

dotenv.config({ path: './.env' });
const PORT = process.env.PORT || 3000;
const YOUR_APP_SECRET = process.env.APP_SECRET;
const YOUR_APP_ID = process.env.APP_ID;

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

    const result = await axios.post(
      'https://www.ddpurse.com/platform/openapi/access_token',
      data
    );
    console.log('==============access token result==============\n', result);
    const accessToken = result.data.data.access_token;
    if (accessToken) {
      const userInfo = await axios.get(
        'https://www.ddpurse.com/platform/openapi/get_user_info?access_token=' +
          accessToken
      );
      console.log('==============user info result==============\n', userInfo);
      res.redirect(
        '/restricted-page/?name=' +
          userInfo.data.data.user_name +
          '&pic=' +
          userInfo.data.data.user_avatar
      );
    }
  } catch (err) {
    console.log('==============ERROR==============\n', err);
  }
});

app.get('/restricted-page', async (req, res) => {
  res.sendFile(path.join(__dirname + '/restricted-page.html'));
});

app.listen(PORT, () =>
  console.log(`Example app listening at http://localhost:${PORT}`)
);
