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
    products: ['auth'],
    language: 'en',
    webhook: 'https://webhook.example.com',
    redirect_uri: 'http://localhost:3001/plaid/callback',
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
