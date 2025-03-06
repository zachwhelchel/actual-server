import express from 'express';
import validateUser from './util/validate-user.js';
import { StreamChat } from 'stream-chat';
import validateSession from './util/validate-user.js';
import Airtable from 'airtable';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
    console.log("hawktua:" + JSON.stringify(req.headers))


  let user = await validateUser(req, res);


  if (!user) {
    return;
  }
  next();
});

app.post('/', async (req, res) => {

  // Define values.
  const api_key = '4skd9jkc6pyk'
  const api_secret = process.env.REACT_APP_CHAT_SECRET



  const session = validateSession(req, res);

  const userId = session.user_id;

  if (!userId) {
    return response.status(401).json({ error: 'User not authenticated' });
  }

  // Set up Airtable connection

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  // Set up Airtable connection
  const base = new Airtable({ 
    apiKey: REACT_APP_AIRTABLE_KEY 
  }).base(REACT_APP_AIRTABLE_BASE);

  
  // Determine the correct account table name based on environment variable
  
  console.log("attempt")

  // 1. Find the account record for the current user
  const accountRecords = await base(process.env.REACT_APP_AIRTABLE_TABLE).select({
    filterByFormula: `{user_id} = '${userId}'`,
    maxRecords: 1
  }).firstPage();
  
  if (accountRecords.length === 0) {
    return response.status(404).json({ error: `${process.env.REACT_APP_AIRTABLE_TABLE} not found for current user` });
  }
  
  const user_id = accountRecords[0].get('stream_chat_user_id');
  // const user_id = process.env.REACT_APP_CHAT_USER_ID ////// this doesn't exist... we need to pull it from the airtableeeeee

    console.log("hawktua api_secret:" + api_secret)
    console.log("hawktua user_id:" + user_id)

  // Initialize a Server Client
  const serverClient = StreamChat.getInstance(api_key, api_secret);
  // Create User Token

      console.log("hawktua serverClient:" + user_id)

const token = serverClient.createToken(Array.isArray(user_id) ? user_id[0] : user_id);

      console.log("hawktua token:" + token)

  console.log("Sending chat access token: " + token);

  let REACT_APP_CHAT_ACCESS_TOKEN = token;

  res.send({
    status: 'ok',
    data: { 
      REACT_APP_CHAT_ACCESS_TOKEN: REACT_APP_CHAT_ACCESS_TOKEN, 
    },
  });
});
