const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('src'));
const YOUR_APP_SECRET = process.env.APP_SECRET;
const YOUR_APP_ID = process.env.APP_ID;

app.get('/auth', async (req, res) => {
  // console.log('req, res', req, res);
  try {
    const code = req.params.code;
    const result = await axios.post(
      'https://www.ddpurse.com/openapi/platform/access_token',
      {
        app_id: YOUR_APP_ID,
        secret: YOUR_APP_SECRET,
        code: code,
      }
    );
    const accessToken = result.data.data.access_token;
    if (accessToken) {
      const userInfo = await axios.get(
        'https://www.ddpurse.com/platform/openapi/get_user_info?access_token=' +
          accessToken
      );
      res.redirect('/home/?name=' + userInfo.data.data.user_name);
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
