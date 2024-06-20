import express from 'express';
import { StreamChat } from 'stream-chat';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
  next();
});

app.get('/', async (req, res) => {

  console.log("Sending env vars.");


  // Define values.
  const api_key = '4q98r9p2kn2g'
  const api_secret = 'yjwpkgg4k9pqg989a62x4k2jkgyjzayv6hzw9wy7vj3yeaxupr3ynrgj8fvgeecm'
  const user_id = process.env.REACT_APP_CHAT_USER_ID

  // Initialize a Server Client
  const serverClient = StreamChat.getInstance(api_key, api_secret);
  // Create User Token
  const token = serverClient.createToken(user_id);

  console.log(token);

  let REACT_APP_BILLING_STATUS = process.env.REACT_APP_BILLING_STATUS;
  let REACT_APP_TRIAL_END_DATE = process.env.REACT_APP_TRIAL_END_DATE;
  let REACT_APP_START_PAYING_DATE = process.env.REACT_APP_START_PAYING_DATE;
  let REACT_APP_ZOOM_RATE = process.env.REACT_APP_ZOOM_RATE;
  let REACT_APP_ZOOM_LINK = process.env.REACT_APP_ZOOM_LINK;
  let REACT_APP_CHAT_USER_ID = process.env.REACT_APP_CHAT_USER_ID;
  let REACT_APP_CHAT_ACCESS_TOKEN = token;
  let REACT_APP_COACH = process.env.REACT_APP_COACH;
  let REACT_APP_COACH_FIRST_NAME = process.env.REACT_APP_COACH_FIRST_NAME;
  let REACT_APP_USER_FIRST_NAME = process.env.REACT_APP_USER_FIRST_NAME;
  let REACT_APP_UI_MODE = process.env.REACT_APP_UI_MODE;

  res.send({
    status: 'ok',
    data: { 
      REACT_APP_BILLING_STATUS: REACT_APP_BILLING_STATUS, 
      REACT_APP_TRIAL_END_DATE: REACT_APP_TRIAL_END_DATE, 
      REACT_APP_START_PAYING_DATE: REACT_APP_START_PAYING_DATE, 
      REACT_APP_ZOOM_RATE: REACT_APP_ZOOM_RATE, 
      REACT_APP_ZOOM_LINK: REACT_APP_ZOOM_LINK, 
      REACT_APP_CHAT_USER_ID: REACT_APP_CHAT_USER_ID, 
      REACT_APP_CHAT_ACCESS_TOKEN: REACT_APP_CHAT_ACCESS_TOKEN, 
      REACT_APP_COACH: REACT_APP_COACH, 
      REACT_APP_COACH_FIRST_NAME: REACT_APP_COACH_FIRST_NAME, 
      REACT_APP_USER_FIRST_NAME: REACT_APP_USER_FIRST_NAME, 
      REACT_APP_UI_MODE: REACT_APP_UI_MODE,  
    },
  });
});
