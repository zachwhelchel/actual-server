import express from 'express';
import https from 'https';
import { SecretName, secretsService } from '../services/secrets-service.js';
import { handleError } from '../app-gocardless/util/handle-error.js';
import { requestLoggerMiddleware } from '../util/middlewares.js';
import validateSession from '../util/validate-user.js';
import { Configuration, PlaidApi, Products, PlaidEnvironments } from 'plaid';

const app = express();
export { app as handlers };
app.use(express.json());
app.use(requestLoggerMiddleware);

let REACT_APP_PLAID_CLIENT_ID = process.env.REACT_APP_PLAID_CLIENT_ID;
let REACT_APP_PLAID_SECRET = process.env.REACT_APP_PLAID_SECRET;

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // or development/production
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': REACT_APP_PLAID_CLIENT_ID,
      'PLAID-SECRET': REACT_APP_PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);



app.post('/api/create_link_token', async function (request, response) {

  console.log('create_link_token')

  const session = validateSession(request, response);

  console.log('session.user_id')
  console.log(session.user_id)






  const clientUserId = session.user_id;
  const plaidRequest = {
    user: {
      // This should correspond to a unique id for the current user.
      client_user_id: clientUserId,
    },
    client_name: 'Plaid Test App',
    products: ['transactions'],
    language: 'en',
    webhook: 'https://webhook.example.com',
    redirect_uri: 'http://localhost:3001/accounts',
    country_codes: ['US'],
  };
  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);


    console.log('createTokenResponse')
    console.log(createTokenResponse)
    // response.json(createTokenResponse.data);

    response.send({
      status: 'ok',
      data: createTokenResponse.data,
    });
    return;



  } catch (error) {
    // handle error
    console.log('error')
    console.log(error)

  }
});


app.post('/api/exchange_public_token', async function (request, response) {
          console.log('exchange_public_token')
          console.log(request.body)

  const publicToken = request.body.public_token;

  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    // These values should be saved to a persistent database and
    // associated with the currently signed-in user
    const accessToken = response.data.access_token;
    const itemID = response.data.item_id;

    console.log('accessToken')
    console.log(accessToken)
    console.log('itemID')
    console.log(itemID)

    res.json({ public_token_exchange: 'complete' });
  } catch (error) {
    // handle error

        console.log(error)

  }
});


