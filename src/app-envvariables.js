import express from 'express';
import { StreamChat } from 'stream-chat';
import Stripe from 'stripe';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
  next();
});

app.get('/', async (req, res) => {
  console.log('Sending env vars.');

  let REACT_APP_BILLING_STATUS = process.env.REACT_APP_BILLING_STATUS;
  let REACT_APP_TRIAL_END_DATE = process.env.REACT_APP_TRIAL_END_DATE;
  let REACT_APP_START_PAYING_DATE = process.env.REACT_APP_START_PAYING_DATE;
  let REACT_APP_ZOOM_RATE = process.env.REACT_APP_ZOOM_RATE;
  let REACT_APP_ZOOM_LINK = process.env.REACT_APP_ZOOM_LINK;
  let REACT_APP_CHAT_USER_ID = process.env.REACT_APP_CHAT_USER_ID;
  let REACT_APP_COACH = process.env.REACT_APP_COACH;
  let REACT_APP_COACH_FIRST_NAME = process.env.REACT_APP_COACH_FIRST_NAME;
  let REACT_APP_USER_FIRST_NAME = process.env.REACT_APP_USER_FIRST_NAME;
  let REACT_APP_USER_EMAIL = process.env.REACT_APP_USER_EMAIL;
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
      REACT_APP_USER_EMAIL: REACT_APP_USER_EMAIL,
      REACT_APP_UI_MODE: REACT_APP_UI_MODE,
    },
  });
});


app.post('/create-checkout-session', async (req, res) => {

  const stripe = new Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY);

  try {
    const { userId, successUrl, cancelUrl, premium } = req.body;
    
    console.log("hellllloooo")
    console.log(req.body)
    console.log(successUrl)
    console.log(cancelUrl)

    //could prefill email but with apple anon emails from apple login would be a weird experience.
    //idk if the prefill locks it or not either.


    if (premium) {
      const session = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            price: 'price_1RtYGpRtLF82W4vRg9hkdxNS', // Your premium price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        metadata: {
          app_user_id: userId,
        },
        subscription_data: {
          metadata: {
            app_user_id: userId,
          },
        },
      });

      res.send({
        status: 'ok',
        data: session.url,
      });

    } else {

      const session = await stripe.checkout.sessions.create({
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            price: 'price_1RtYGTRtLF82W4vRE77BF358', // Your basic price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        metadata: {
          app_user_id: userId,
        },
        subscription_data: {
          metadata: {
            app_user_id: userId,
          },
        },
      });

      res.send({
        status: 'ok',
        data: session.url,
      });
    }


  } catch (error) {
    console.error('Error create-checkout-session:', error);
    throw error;
  }

});

