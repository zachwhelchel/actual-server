import express from 'express';
import validateUser from './util/validate-user.js';
import { StreamChat } from 'stream-chat';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
    console.log("whyme FRIEND:" + JSON.stringify(req.headers))


  let user = await validateUser(req, res);


  if (!user) {
    return;
  }
  next();
});

app.post('/', async (req, res) => {

  // Define values.
  const api_key = '4q98r9p2kn2g'
  const api_secret = 'yjwpkgg4k9pqg989a62x4k2jkgyjzayv6hzw9wy7vj3yeaxupr3ynrgj8fvgeecm'
  const user_id = process.env.REACT_APP_CHAT_USER_ID

  // Initialize a Server Client
  const serverClient = StreamChat.getInstance(api_key, api_secret);
  // Create User Token
  const token = serverClient.createToken(user_id);

  console.log("Sending chat access token: " + token);

  let REACT_APP_CHAT_ACCESS_TOKEN = token;

  res.send({
    status: 'ok',
    data: { 
      REACT_APP_CHAT_ACCESS_TOKEN: REACT_APP_CHAT_ACCESS_TOKEN, 
    },
  });
});
