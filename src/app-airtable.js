import express from 'express';
import {
  errorMiddleware,
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from './util/middlewares.js';
import validateSession from './util/validate-user.js';
import Airtable from 'airtable';

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

  console.log("Sending dataaaaaa.");
  //console.log(req);

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body)

  const base = new Airtable({
    apiKey:'patD1GWrGGJA0pvQ9.9e5b4ebdaf739900ef004a7a8b2ef58693cb444c39e547859b54492e474cc721'
  }).base('appYAaDkGzB3ecOzl');

  try {
    // First try to find the user
    const existingRecords = await base('Accounts').select({
      filterByFormula: `{user_id} = '${session.user_id}'`
    }).all();

    console.log('existingRecords')
    //console.log(userId)

    // If user exists, return the record
    if (existingRecords.length > 0) {
      res.send({
        status: 'ok',
        data: existingRecords[0],
      });
      return;
    }

    // If user doesn't exist, create new record

    if (req.body.coachId !== null && req.body.coachId !== undefined && req.body.coachId !== '') {
      const newRecord = await base('Accounts').create([
        {
          fields: {
            user_id: session.user_id,
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
      const newRecord = await base('Accounts').create([
        {
          fields: {
            user_id: session.user_id
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
    apiKey:'patD1GWrGGJA0pvQ9.9e5b4ebdaf739900ef004a7a8b2ef58693cb444c39e547859b54492e474cc721'
  }).base('appYAaDkGzB3ecOzl');

  const existingRecords = await base('Accounts').select({
    filterByFormula: `{user_id} = '${userId}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

  try {
    const updatedRecord = await base('Accounts').update([
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

  console.log("Sending dataaaaaa.");

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body.first_name)

  let userId = session.user_id;

  const base = new Airtable({
    apiKey:'patD1GWrGGJA0pvQ9.9e5b4ebdaf739900ef004a7a8b2ef58693cb444c39e547859b54492e474cc721'
  }).base('appYAaDkGzB3ecOzl');

  const existingRecords = await base('Accounts').select({
    filterByFormula: `{user_id} = '${session.user_id}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

  try {
    const updatedRecord = await base('Accounts').update([
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

  console.log("Sending dataaaaaa.");

  const session = validateSession(req, res);

  console.log('session.user_id')
  console.log(session.user_id)

  console.log('req.body.test')
  console.log(req.body.local_storage)

  let userId = session.user_id;

  // Update record in Airtable
  const base = new Airtable({
    apiKey:'patD1GWrGGJA0pvQ9.9e5b4ebdaf739900ef004a7a8b2ef58693cb444c39e547859b54492e474cc721'
  }).base('appYAaDkGzB3ecOzl');


  const existingRecords = await base('Accounts').select({
    filterByFormula: `{user_id} = '${session.user_id}'`
  }).all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id
  }

 // Update record in Airtable
  try {
    const response = await base('Accounts').update([
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
