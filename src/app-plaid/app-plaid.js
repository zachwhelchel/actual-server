import express from 'express';
import https from 'https';
import { SecretName, secretsService } from '../services/secrets-service.js';
import { handleError } from '../app-gocardless/util/handle-error.js';
import { requestLoggerMiddleware } from '../util/middlewares.js';
import validateSession from '../util/validate-user.js';
import { Configuration, PlaidApi, Products, PlaidEnvironments } from 'plaid';
import Airtable from 'airtable';

import {
  getUserInfo,
} from '../account-db.js';

const app = express();
export { app as handlers };
app.use(express.json());
app.use(requestLoggerMiddleware);

let REACT_APP_PLAID_CLIENT_ID = process.env.REACT_APP_PLAID_CLIENT_ID;
let REACT_APP_PLAID_SECRET = process.env.REACT_APP_PLAID_SECRET;
let REACT_APP_PLAID_REDIRECT_URL = process.env.REACT_APP_PLAID_REDIRECT_URL;
let REACT_APP_PLAID_ENVIRONMENT = process.env.REACT_APP_PLAID_ENVIRONMENT;



const configuration = new Configuration({
  basePath: REACT_APP_PLAID_ENVIRONMENT === "production" ? PlaidEnvironments.production : PlaidEnvironments.sandbox, // or development/production
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': REACT_APP_PLAID_CLIENT_ID,
      'PLAID-SECRET': REACT_APP_PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);



app.post('/api/create_link_token', async function (request, response) {


  let plaidRequest = {}

  const session = validateSession(request, response);
  const clientUserId = session.user_id;


  const itemIdExists = request.body.item_id !== undefined && 
                       request.body.item_id !== null && 
                       request.body.item_id !== '';
  
    console.log(`request.body: ${request.body}`);


  // Assign it only if it exists
  const item_id = itemIdExists ? request.body.item_id : null;
  
  // Now you can use item_id in your logic
  if (itemIdExists) {
    // Code for when item_id exists
    console.log(`Processing with item_id: ${item_id}`);


    //so we need to go and get the access token then...


    console.log('session.user_id')
    console.log(session.user_id)

    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    // Set up Airtable connection

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;
    let REACT_APP_AIRTABLE_ACCOUNT_FIELD = process.env.REACT_APP_AIRTABLE_ACCOUNT_FIELD;



    // Set up Airtable connection
    const base = new Airtable({ 
      apiKey: REACT_APP_AIRTABLE_KEY 
    }).base(REACT_APP_AIRTABLE_BASE);

        
    // 2. Get all Plaid items associated with this account    
    const plaidItemsRecords = await base('PlaidItems').select({
      filterByFormula: `AND(
        FIND('${userId}', {${REACT_APP_AIRTABLE_ACCOUNT_FIELD}}),
        {item_id} = '${item_id}'
      )`,
      maxRecords: 1  // This limits the result to just the first match
    }).firstPage();

    // Get the first record from the results
    const firstRecord = plaidItemsRecords[0];

    // Check if a record was found before accessing the access_token
    let accessToken = null;
    if (firstRecord) {
      accessToken = firstRecord.get('access_token');
    }

    plaidRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: clientUserId,
      },
      client_name: 'MyBudgetCoach',
      language: 'en',
      webhook: 'https://webhook.example.com',
      redirect_uri: REACT_APP_PLAID_REDIRECT_URL,
      country_codes: ['US'],
      access_token: accessToken,
    };

  } else {
    // Code for when item_id doesn't exist
    console.log('No item_id provided');


    plaidRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: clientUserId,
      },
      client_name: 'MyBudgetCoach',
      products: ['transactions'],
      language: 'en',
      webhook: 'https://webhook.example.com',
      redirect_uri: REACT_APP_PLAID_REDIRECT_URL,
      country_codes: ['US'],
    };


  }


  console.log('create_link_token')

  console.log('session.user_id')
  console.log(session.user_id)





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
    console.log('itemID')
    console.log(itemID)


    const session = validateSession(request, response);

    console.log('session.user_id')
    console.log(session.user_id)

    const result = await savePlaidItemToAirtable(
      itemID, 
      accessToken, 
      session.user_id
    );

    res.json({ public_token_exchange: 'complete' });
  } catch (error) {
    // handle error

        console.log(error)

  }
});



app.post('/institutions', async function (request, response) {
  try {
    // Get the current user ID from the session

    const session = validateSession(request, response);

    console.log('session.user_id')
    console.log(session.user_id)

    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    // Set up Airtable connection

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;
    let REACT_APP_AIRTABLE_ACCOUNT_FIELD = process.env.REACT_APP_AIRTABLE_ACCOUNT_FIELD;

    // Set up Airtable connection
    const base = new Airtable({ 
      apiKey: REACT_APP_AIRTABLE_KEY 
    }).base(REACT_APP_AIRTABLE_BASE);

        
    // 2. Get all Plaid items associated with this account    
    const plaidItemsRecords = await base('PlaidItems').select({
      filterByFormula: `FIND('${userId}', {${REACT_APP_AIRTABLE_ACCOUNT_FIELD}})`
    }).all();

    if (plaidItemsRecords.length === 0) {
      return response.status(200).json({ accounts: [] }); // No linked accounts yet
    }

    // console.log(plaidItemsRecords)
    
    // 4. Fetch accounts from Plaid for each item
    const allInstitutions = [];
    
    for (const item of plaidItemsRecords) {
      const accessToken = item.fields.access_token;
      
      try {
        // Get accounts for this item
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken
        });
        
        // Get institution data for this item
        const itemResponse = await plaidClient.itemGet({
          access_token: accessToken
        });
        
        const institutionId = itemResponse.data.item.institution_id;
        
        if (institutionId) {
          const institutionResponse = await plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: ['US']
          });
          
          const institution = institutionResponse.data.institution;

          const institutionInfo = {
            name: institution.name,
            item_id: item.fields.item_id,
            accounts_count: accountsResponse.data.accounts.length
          };

          allInstitutions.push(institutionInfo);

        }
                
      } catch (error) {
        console.error(`Error fetching institutions for item ${item.fields.item_id}:`, error);
        // Continue to next item even if this one fails
      }
    }
    
    // Return all the accounts

    const results = {
      institutions: allInstitutions
    };


    // console.log(allInstitutions)

    response.send({
      status: 'ok',
      data: results,
    });
    return;


    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return response.status(500).json({ error: 'Failed to fetch accounts' });
  }
});



app.post('/institution/remove', async function (request, response) {
  try {
    // Get the current user ID from the session

    const item_id = request.body.item_id.item_id // why the double here needed?


    const session = validateSession(request, response);
    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    // Set up Airtable connection

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;
    let REACT_APP_AIRTABLE_ACCOUNT_FIELD = process.env.REACT_APP_AIRTABLE_ACCOUNT_FIELD;

    // Set up Airtable connection
    const base = new Airtable({ 
      apiKey: REACT_APP_AIRTABLE_KEY 
    }).base(REACT_APP_AIRTABLE_BASE);

        
    // 2. Get all Plaid items associated with this account    
    const plaidItemsRecords = await base('PlaidItems').select({
      filterByFormula: `AND(
        FIND('${userId}', {${REACT_APP_AIRTABLE_ACCOUNT_FIELD}}),
        {item_id} = '${item_id}'
      )`,
      maxRecords: 1  // This limits the result to just the first match
    }).firstPage();

    // Get the first record from the results
    const firstRecord = plaidItemsRecords[0];

    console.log('first_item')

    console.log(userId)
    console.log(item_id)

    console.log('first_item')
    // console.log(firstRecord)

    // Check if a record was found before accessing the access_token
    let accessToken = null;
    if (firstRecord) {
      accessToken = firstRecord.get('access_token');
    }

    try {
      const response = await plaidClient.itemRemove({
        access_token: accessToken
      });
      
      console.log('Successfully removed Plaid connection');

      await base('PlaidItems').destroy(firstRecord.id);
      console.log(`Successfully deleted record with ID: ${firstRecord.id}`);

      const results = {
      };

      response.send({
        status: 'ok',
        data: results,
      });

      return;
    } catch (error) {
      console.error('Error removing Plaid connection:', error);
      throw error;
    }

    
  } catch (error) {
    console.error('Error removing Plaid connection:', error);
    return response.status(500).json({ error: 'Error removing Plaid connection' });
  }
});




app.post('/accounts', async function (request, response) {
  try {
    // Get the current user ID from the session

    const session = validateSession(request, response);

    console.log('session.user_id')
    console.log(session.user_id)

    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    // Set up Airtable connection

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;
    let REACT_APP_AIRTABLE_ACCOUNT_FIELD = process.env.REACT_APP_AIRTABLE_ACCOUNT_FIELD;

    // Set up Airtable connection
    const base = new Airtable({ 
      apiKey: REACT_APP_AIRTABLE_KEY 
    }).base(REACT_APP_AIRTABLE_BASE);

        
    // 2. Get all Plaid items associated with this account    
    const plaidItemsRecords = await base('PlaidItems').select({
      filterByFormula: `FIND('${userId}', {${REACT_APP_AIRTABLE_ACCOUNT_FIELD}})`
    }).all();

    if (plaidItemsRecords.length === 0) {
      return response.status(200).json({ accounts: [] }); // No linked accounts yet
    }

    // console.log(plaidItemsRecords)
    
    // 4. Fetch accounts from Plaid for each item
    const allAccounts = [];
    
    for (const item of plaidItemsRecords) {
      const accessToken = item.fields.access_token;
      
      try {
        // Get accounts for this item
        const accountsResponse = await plaidClient.accountsGet({
          access_token: accessToken
        });
        
        // Get institution data for this item
        const itemResponse = await plaidClient.itemGet({
          access_token: accessToken
        });
        
        const institutionId = itemResponse.data.item.institution_id;
        let institutionInfo = {
          name: 'Unknown Institution',
          domain: '',
          id: item.fields.item_id
        };
        
        // Get institution details if we have an institution ID
        if (institutionId) {
          const institutionResponse = await plaidClient.institutionsGetById({
            institution_id: institutionId,
            country_codes: ['US']
          });
          
          const institution = institutionResponse.data.institution;
          institutionInfo = {
            name: institution.name,
            domain: institution.url || '',
            id: item.fields.item_id
          };
        }
        
        // Format accounts to match expected structure
        const formattedAccounts = accountsResponse.data.accounts.map(account => ({
          id: account.account_id,
          name: account.name,
          org: institutionInfo,
          balance: account.balances.current || 0
        }));
        
        allAccounts.push(...formattedAccounts);
      } catch (error) {
        console.error(`Error fetching accounts for item ${item.fields.item_id}:`, error);
        // Continue to next item even if this one fails
      }
    }
    
    // Return all the accounts

    const results = {
      accounts: allAccounts
    };


    // console.log(allAccounts)

    response.send({
      status: 'ok',
      data: results,
    });
    return;


    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return response.status(500).json({ error: 'Failed to fetch accounts' });
  }
});


// app.post('/transactions', async function (request, response) {
//   try {
//     // Get the current user ID from the session

    
//     const results = {
//       transactions: []
//     };

//     response.send({
//       status: 'ok',
//       data: results,
//     });
//     return;


    
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return response.status(500).json({ error: 'Failed to fetch transactions' });
//   }
// });




app.post(
  '/transactions',
  handleError(async (req, res) => {

    const session = validateSession(req, res);

    const user = getUserInfo(session.user_id);


    const { accountId, startDate, bankId } = req.body;


    try {
      // Input validation - same as SimpleFIN
      if (Array.isArray(accountId) != Array.isArray(startDate)) {
        console.log(accountId, startDate);
        throw new Error(
          'accountId and startDate must either both be arrays or both be strings',
        );
      }
      if (Array.isArray(accountId) && accountId.length !== startDate.length) {
        console.log(accountId, startDate);
        throw new Error('accountId and startDate arrays must be the same length');
      }

      // Get earliest date for fetching
      const earliestStartDate = Array.isArray(startDate)
        ? startDate.reduce((a, b) => (a < b ? a : b))
        : startDate;
      
      console.log('accountId:' + accountId)
      console.log('startDate:' + startDate)



      console.log('session.user_id')
      console.log(session.user_id)

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
      
      //const accountId = accountRecords[0].id;
      

      console.log("attempt")




      // First fetch the records as you're already doing
      // const plaidItemsRecords = await base('PlaidItems').select({
      //   filterByFormula: `FIND('${userId}', {stage_account})`
      // }).all();

      const plaidItemsRecords = await base('PlaidItems').select({
        filterByFormula: `{item_id} = '${bankId}'`
      }).all();


      // ID you're looking for
      const targetId = userId;

      // Filter records that contain the target ID
      const matchingRecords = plaidItemsRecords.filter(record => {
        try {
          // Get the JSON string from the field (replace 'yourFieldName' with your actual field name)
          const jsonString = record.get('user_ids_shared_with');
          
          // Parse the JSON string into an actual array
          const idsArray = jsonString ? JSON.parse(jsonString) : [];
          
          console.log("yolo")

          //console.log(record.get('user_id')?.[0])
          console.log(targetId)

          // Check if the array contains the target ID
          return idsArray.includes(targetId) || record.get('user_id')?.[0] === targetId;
        } catch (error) {
          // Handle parsing errors (in case the field doesn't contain valid JSON)
          console.error(`Error parsing JSON for record ${record.id}:`, error);
          return false;
        }
      });

      if (matchingRecords.length === 0) {
                  console.log("yolo1")

        return res.status(200).json({ accounts: [] }); // No linked accounts yet
      }

          console.log("yolo2")

      // Create a dictionary with item_id as key and access_token as value
      const plaidItemsDict = {};

      // Populate the dictionary
      matchingRecords.forEach(record => {
        // Safely access the fields we need
        if (record.fields && record.fields.item_id && record.fields.access_token) {

          if (true) {
            plaidItemsDict[record.fields.item_id] = record.fields.access_token;
          }


        }
      });

      //console.log('Plaid items dictionary:', plaidItemsDict);







      let results;
      try {
        results = await getTransactions(
          Array.isArray(accountId) ? accountId : [accountId],
          bankId,
          new Date(earliestStartDate),
          plaidItemsDict
        );
      } catch (e) {
        return response.status(500).json({ error: 'Failed to fetch transactions' });
      }

      let response = {};
      if (Array.isArray(accountId)) {
        for (let i = 0; i < accountId.length; i++) {
          const id = accountId[i];
          response[id] = getAccountResponse(results, id, new Date(startDate[i]));
        }
      } else {
        response = getAccountResponse(results, accountId, new Date(startDate));
      }

      if (results.hasError) {
        res.send({
          status: 'ok',
          data: !Array.isArray(accountId)
            ? results.errors[accountId][0]
            : {
                ...response,
                errors: results.errors,
              },
        });
        return;
      }


      console.log('final response')
      //console.log(JSON.stringify(response))




      res.send({
        status: 'ok',
        data: response,
      });
    } catch (error) {
      console.error('Transaction retrieval error:', error);
      return serverDown(error, res);
    }
  }),
);

function getDate(date) {
  return date.toISOString().split('T')[0];
}

// Main function to fetch transactions from Plaid
async function getTransactions(accountIds, bankId, startDate, plaidItemsDict, endDate = new Date()) {
  try {
    const startDateString = getDate(startDate);
    const endDateString = getDate(endDate);
    
    console.log(`Fetching transactions from ${startDateString} to ${endDateString}`);
    // console.log(`plaidItemsRecords ${plaidItemsRecords}`);
    // console.log(plaidItemsRecords);

    let allTransactions = [];
    let allAccounts = new Map(); // Using a Map to avoid duplicates

    for (const accountId of accountIds) {


      //no for that account I need to get the bank id or whatever...

      //bankId


      console.log(`bankId ${bankId}`);

    
      const accessToken = plaidItemsDict[bankId];


      //console.log(`accessToken ${accessToken}`);

//plaidItem.access_token will fail because we aren't saving the right thing currently for that accountId to be the itemId

      // Initialize with pagination
      let offset = 0;
      const limit = 100;
      let hasMore = true;
            
      // Use Plaid's transaction pagination
      while (hasMore) {
        const response = await plaidClient.transactionsGet({
          access_token: accessToken,
          start_date: startDateString,
          end_date: endDateString,
          options: {
            count: limit,
            offset: offset,
            account_ids: [accountId] //assumes not array too
          }
        });
        
        const { transactions, total_transactions, accounts } = response.data;

        // Flip the sign of all transaction amounts
        const flippedTransactions = transactions.map(transaction => {
          // Check if amount property exists
          if (transaction.amount !== undefined && transaction.amount !== null) {
            return {
              ...transaction,
              amount: -transaction.amount
            };
          } else {
            // If amount is missing, return the transaction unchanged
            console.log('Transaction missing amount property:', JSON.stringify(transaction, null, 2));
            return transaction;
          }
        });

        allTransactions = [...allTransactions, ...flippedTransactions];
        
        if (accounts && accounts.length > 0) {
          accounts.forEach(account => {
            // Use Map to ensure we don't duplicate accounts
            allAccounts.set(account.account_id, account);
          });
        }

        if (allTransactions.length >= total_transactions) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }


    }


    const accountsArray = Array.from(allAccounts.values());

    // Format response to match expected structure
    return {
      accounts: accountsArray.map(account => ({
        id: account.account_id,
        name: account.name,
        balance: account.balances.current.toString(),
        currency: account.balances.iso_currency_code,
      })),
      transactions: allTransactions,
      hasError: false,
      errors: {}
    };
  } catch (error) {
    console.error('Error fetching transactions from Plaid:', error);
    
    if (error.response?.data?.error_code === 'INVALID_ACCESS_TOKEN') {
      throw new Error('INVALID_ACCESS_TOKEN');
    }
    
    throw error;
  }
}


function getAccountResponse(results, accountId, startDate) {
  const account = results.accounts.find((a) => a.id === accountId);
  
  if (!account) {
    console.log(
      `The account "${accountId}" was not found. Here were the accounts returned:`,
    );
    results.accounts.forEach((a) => console.log(`${a.id} - ${a.name}`));
    logAccountError(results, accountId, {
      error_type: 'ACCOUNT_MISSING',
      error_code: 'ACCOUNT_MISSING',
      reason: `The account "${accountId}" was not found. Try unlinking and relinking the account.`,
    });
    return;
  }

  const formattedBalance = parseFloat(account.balance).toFixed(2);


  const startingBalance = parseInt((formattedBalance || '0').replace('.', ''));
  const date = getDate(new Date());

  const balances = [
    {
      balanceAmount: {
        amount: formattedBalance,
        currency: account.currency,
      },
      balanceType: 'expected',
      referenceDate: date,
    },
    {
      balanceAmount: {
        amount: formattedBalance,
        currency: account.currency,
      },
      balanceType: 'interimAvailable',
      referenceDate: date,
    },
  ];

  const all = [];
  const booked = [];
  const pending = [];

  for (const trans of results.transactions.filter(t => t.account_id === accountId)) {
    const newTrans = {};
    const transactionDate = new Date(trans.date);

    if (transactionDate < startDate) {
      continue;
    }

    newTrans.date = getDate(transactionDate);
    newTrans.booked = !trans.pending;
    newTrans.payeeName = trans.merchant_name || trans.name;
    newTrans.remittanceInformationUnstructured = trans.name;
    newTrans.transactionAmount = { 
      amount: trans.amount.toFixed(2), 
      currency: trans.iso_currency_code 
    };
    newTrans.transactionId = trans.transaction_id;
    newTrans.valueDate = newTrans.date;

    if (newTrans.booked) {
      booked.push(newTrans);
    } else {
      pending.push(newTrans);
    }
    all.push(newTrans);
  }

  return { balances, startingBalance, transactions: { all, booked, pending } };
}










/**
 * Save a Plaid item to Airtable
 * @param {string} itemId - The Plaid item_id
 * @param {string} accessToken - The Plaid access_token
 * @param {string} userId - The current user's ID
 * @param {object} airtableConfig - Configuration for Airtable { apiKey, baseId }
 * @returns {Promise<object>} - The created record information
 */
async function savePlaidItemToAirtable(itemId, accessToken, userId) {
  try {

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;
    let REACT_APP_AIRTABLE_ACCOUNT_FIELD = process.env.REACT_APP_AIRTABLE_ACCOUNT_FIELD;



    // Set up Airtable connection
    const base = new Airtable({ 
      apiKey: REACT_APP_AIRTABLE_KEY 
    }).base(REACT_APP_AIRTABLE_BASE);
    
    // Validate inputs
    if (!itemId || !accessToken || !userId) {
      throw new Error('Missing required parameters: itemId, accessToken, and userId are required');
    }
    
    // 1. Find the StageAccount record for the current user
    const accountRecords = await base(REACT_APP_AIRTABLE_TABLE).select({
      filterByFormula: `{user_id} = '${userId}'`,
      maxRecords: 1
    }).firstPage();
    
    if (accountRecords.length === 0) {
      throw new Error('Account not found for provided userId');
    }
    
    const accountId = accountRecords[0].id;
    
    // 2. Create the new PlaidItems record with the relationship

    const tableName = REACT_APP_AIRTABLE_ACCOUNT_FIELD

    // First, check if a record with this item_id already exists
    const existingRecords = await base('PlaidItems').select({
      filterByFormula: `{item_id} = '${itemId}'`,
      maxRecords: 1
    }).firstPage();

    let result;

    if (existingRecords.length > 0) {
      // Update the existing record
      const existingRecord = existingRecords[0];
      result = await base('PlaidItems').update(existingRecord.id, {
        access_token: accessToken,
        [tableName]: [accountId] // This maintains the relationship
      });
      console.log('Updated existing record');
    } else {
      // Create a new record
      result = await base('PlaidItems').create({
        item_id: itemId,
        access_token: accessToken,
        [tableName]: [accountId] // This creates the relationship
      });
      console.log('Created new record');
    }



    return {
      success: true,
      record: {
        id: newRecord.id,
        item_id: newRecord.fields.item_id
      }
    };
  } catch (error) {
    console.error('Error saving Plaid item to Airtable:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
}



