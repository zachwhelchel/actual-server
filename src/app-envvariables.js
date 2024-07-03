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

  let REACT_APP_BILLING_STATUS = process.env.REACT_APP_BILLING_STATUS;
  let REACT_APP_TRIAL_END_DATE = process.env.REACT_APP_TRIAL_END_DATE;
  let REACT_APP_START_PAYING_DATE = process.env.REACT_APP_START_PAYING_DATE;
  let REACT_APP_ZOOM_RATE = process.env.REACT_APP_ZOOM_RATE;
  let REACT_APP_ZOOM_LINK = process.env.REACT_APP_ZOOM_LINK;
  let REACT_APP_CHAT_USER_ID = process.env.REACT_APP_CHAT_USER_ID;
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
      REACT_APP_COACH: REACT_APP_COACH, 
      REACT_APP_COACH_FIRST_NAME: REACT_APP_COACH_FIRST_NAME, 
      REACT_APP_USER_FIRST_NAME: REACT_APP_USER_FIRST_NAME, 
      REACT_APP_UI_MODE: REACT_APP_UI_MODE,  
    },
  });
});
