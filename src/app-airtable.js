import express from 'express';
import {
  errorMiddleware,
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from './util/middlewares.js';
import validateSession from './util/validate-user.js';
import Airtable from 'airtable';

import {
  getUserInfo,
} from './account-db.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLoggerMiddleware);
export { app as handlers };


// app.get('/', 
//   (req, res, next) => {
//     console.log("Before validateSessionMiddleware");
//     next();
//   },
//   validateSessionMiddleware,
//   (req, res, next) => {
//     console.log("After validateSessionMiddleware");
//     next();
//   },
//   async (req, res) => {
//     console.log("Sending dataaaaaa.");
//     res.send({
//       status: 'ok',
//       data: { 
//         data: 'data' 
//       },
//     });
//   }
// );



app.post('/user', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log("Sending dataaaaaa.");
  //console.log(req);

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body)

  const base = new Airtable({
    apiKey:REACT_APP_AIRTABLE_KEY
  }).base(REACT_APP_AIRTABLE_BASE);

  try {
    // First try to find the user
    const existingRecords = await base(REACT_APP_AIRTABLE_TABLE).select({
      filterByFormula: `{user_id} = '${session.user_id}'`
    }).all();

    console.log('existingRecords')
    //console.log(userId)






    // If user doesn't exist, create new record
    // Ok here, creating a user for the first time... we want to:
    // associate them with the openId id
    // set defaults for first/last/email
    // switch the proxy for the form to heard about us or something
    const user = getUserInfo(session.user_id);
    console.log('getUserInfo')
    console.log(user)


    function splitDisplayName(displayName) {
      if (!displayName || typeof displayName !== 'string') {
        return { firstName: null, lastName: null };
      }

      // Trim and split the name
      const parts = displayName.trim().split(/\s+/);
      
      // Check if we have at least two parts that look like names
      // (no special characters, numbers, etc)
      if (parts.length >= 2 && parts.every(part => /^[A-Za-z-']+$/.test(part))) {
        return {
          firstName: parts[0],
          lastName: parts.slice(1).join(' ') // Handles middle names as part of lastName
        };
      }

      return { firstName: null, lastName: null };
    }

    const { firstName, lastName } = splitDisplayName(user.display_name);





    // If user exists, return the record
    if (existingRecords.length > 0) {
      res.send({
        status: 'ok',
        data: existingRecords[0],
      });
      return;
    }

    if (req.body.coachId !== null && req.body.coachId !== undefined && req.body.coachId !== '') {
      const newRecord = await base(REACT_APP_AIRTABLE_TABLE).create([
        {
          fields: {
            user_id: session.user_id,
            autho_id: user.user_name,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            coach: [params.coach]
          }
        }
      ]);

      res.send({
        status: 'ok',
        data: newRecord[0],
      });
      return;
    } else {
      const newRecord = await base(REACT_APP_AIRTABLE_TABLE).create([
        {
          fields: {
            user_id: session.user_id,
            autho_id: user.user_name,
            email: user.email,
            first_name: firstName,
            last_name: lastName
          }
        }
      ]);
      res.send({
        status: 'ok',
        data: newRecord[0],
      });
      return;
    }

  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }

  res.send({
    status: 'ok',
    data: { 
      data: 'failed' 
    },
  });
  return;
});


app.post('/update-coach', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log("Sending dataaaaaa.");
  //console.log(req);

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body)

  let userId = session.user_id;
  let coachId = req.body.coachId;

  const base = new Airtable({
    apiKey:REACT_APP_AIRTABLE_KEY
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE).select({
    filterByFormula: `{user_id} = '${userId}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

  try {
    const updatedRecord = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          coach: [coachId]
        }
      }
    ]);
    
    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
    return;

  } catch (error) {
    console.error('Error updating coach relationship:', error);
    throw error;
  }

  res.send({
    status: 'ok',
    data: { 
      data: 'failed' 
    },
  });
  return;
});


app.post('/update-user', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log("Sending dataaaaaa.");

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body.first_name)

  let userId = session.user_id;

  const base = new Airtable({
    apiKey:REACT_APP_AIRTABLE_KEY
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE).select({
    filterByFormula: `{user_id} = '${session.user_id}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

  try {
    const updatedRecord = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          found_us: req.body.found_us,
          motivation: req.body.motivation,
          language: req.body.language,
          fprom_tid: req.body.fprom_tid,
          fprom_ref: req.body.fprom_ref,
          utm_campaign: req.body.utm_campaign,
          utm_medium: req.body.utm_medium,
          utm_source: req.body.utm_source,
          utm_term: req.body.utm_term,
          utm_content: req.body.utm_content
        }
      }
    ]);
    
    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
    return;

  } catch (error) {
    console.error('Error updating user values:', error);
    throw error;
  }

  res.send({
    status: 'ok',
    data: { 
      data: 'failed' 
    },
  });
  return;
});



app.post('/update-local-storage-sync', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log("Sending dataaaaaa.");

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body.local_storage)

  let userId = session.user_id;

  // Update record in Airtable
  const base = new Airtable({
    apiKey:REACT_APP_AIRTABLE_KEY
  }).base(REACT_APP_AIRTABLE_BASE);


  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE).select({
    filterByFormula: `{user_id} = '${session.user_id}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

 // Update record in Airtable
  try {
    const response = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          'local_storage_sync': req.body.local_storage
        }
      }
    ]);

    res.send({
      status: 'ok',
      data: response[0],
    });
    return;
  } catch (error) {
    console.error('Error updating Airtable record:', error);
    throw error;
  }

  res.send({
    status: 'ok',
    data: { 
      data: 'failed' 
    },
  });
  return;
});


app.use(errorMiddleware);
