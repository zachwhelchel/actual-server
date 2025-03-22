import express from 'express';
import {
  errorMiddleware,
  requestLoggerMiddleware,
  validateSessionMiddleware,
} from './util/middlewares.js';
import validateSession from './util/validate-user.js';
import Airtable from 'airtable';

import { getUserInfo } from './account-db.js';

import axios from 'axios';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLoggerMiddleware);
export { app as handlers };

// Define the Client type or class
class Client {
  constructor(recordId, name, status, statusExpiresAt, joinedAt) {
    this.recordId = recordId;
    this.name = name;
    this.status = status;
    this.statusExpiresAt = statusExpiresAt;
    this.joinedAt = joinedAt;
  }
}

// Function to transform Airtable records into Client entities
function transformToClientEntities(records) {
  return records.map((record) => {
    const fields = record.fields;
    return new Client(
      record.id,
      fields.client_name ? fields.client_name[0] : null,
      fields.client_status,
      fields.client_status_expires_at
        ? fields.client_status_expires_at[0]
        : null,
      fields.client_joined_at
        ? fields.client_joined_at[0]
        : null,
    );
  });
}

const AIRTABLE_TABLES = {
  CLIENTS: 'Clients',
  COACHES: 'Coaches',
  USERS: 'Users',
};

const AIRTABLE_FIELDS = {
  CLIENTS: {
    NAME: 'client_name',
    STATUS: 'client_status',
    STATUS_EXPIRES_AT: 'client_status_expires_at',
    JOINED_AT: 'client_joined_at',
    COACH_USER_ID: 'client_coach_user_id',
  },
  USERS: {},
  COACHES: {},
};

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

  console.log('Sending dataaaaaa.');
  //console.log(req);

  const session = validateSession(req, res);

  console.log('session.user_id');
  console.log(session.user_id);

  //console.log('req.body.test')
  //console.log(req.body)

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  function splitDisplayName(displayName) {
    if (!displayName || typeof displayName !== 'string') {
      return { firstName: null, lastName: null };
    }

    // Trim and split the name
    const parts = displayName.trim().split(/\s+/);

    // Check if we have at least two parts that look like names
    // (no special characters, numbers, etc)
    if (
      parts.length >= 2 &&
      parts.every((part) => /^[A-Za-z-']+$/.test(part))
    ) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '), // Handles middle names as part of lastName
      };
    }

    return { firstName: null, lastName: null };
  }

  try {
    // First try to find the user
    const existingRecords = await base(REACT_APP_AIRTABLE_TABLE)
      .select({
        filterByFormula: `{user_id} = '${session.user_id}'`,
      })
      .all();

    console.log('existingRecords');
    //console.log(userId)

    // If user doesn't exist, create new record
    // Ok here, creating a user for the first time... we want to:
    // associate them with the openId id
    // set defaults for first/last/email
    // switch the proxy for the form to heard about us or something
    const user = getUserInfo(session.user_id);
    console.log('getUserInfo');
    console.log(user);

    const { firstName, lastName } = splitDisplayName(user.display_name);

    let transformed = await transformCoachPhoto(existingRecords[0]);

    // console.log('transformed')
    // console.log(JSON.stringify(transformed))

    // If user exists, return the record
    if (existingRecords.length > 0) {
      res.send({
        status: 'ok',
        data: transformed,
      });
      return;
    }

    console.log('transformed2');

    if (
      req.body.coachId !== null &&
      req.body.coachId !== undefined &&
      req.body.coachId !== ''
    ) {
      const newRecord = await base(REACT_APP_AIRTABLE_TABLE).create([
        {
          fields: {
            user_id: session.user_id,
            auth0_id: user.user_name,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            coach: [req.body.coachId],
          },
        },
      ]);

      let transformed = await transformCoachPhoto(newRecord[0]);

      res.send({
        status: 'ok',
        data: transformed,
      });
    } else {
      const newRecord = await base(REACT_APP_AIRTABLE_TABLE).create([
        {
          fields: {
            user_id: session.user_id,
            auth0_id: user.user_name,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
          },
        },
      ]);

      let transformed = await transformCoachPhoto(newRecord[0]);

      res.send({
        status: 'ok',
        data: transformed,
      });
    }
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
});

async function transformCoachPhoto(record) {
  // If the record doesn't exist or doesn't have a coach_photo, return the record as-is
  if (
    !record ||
    !record.get('coach_photo') ||
    !record.get('coach_photo')?.[0]?.url
  ) {
    return record;
  }

  try {
    // Fetch the image
    const response = await axios.get(record.get('coach_photo')[0].url, {
      responseType: 'arraybuffer',
    });

    // Convert to base64
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');

    console.log('attempt4');

    // Create a new object with the transformed photo

    record.set('coach_photo', [
      {
        base64: `data:image/jpeg;base64,${base64Image}`,
      },
    ]);

    return record;

    // return {
    //   ...record,
    //   coach_photo: [{
    //     base64: `data:image/jpeg;base64,${base64Image}`
    //   }]
    // };
  } catch (error) {
    console.error('Failed to transform coach photo:', error);
    // Return original record if transformation fails
    return record;
  }
}

app.post('/update-coach', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log('Sending dataaaaaa.');
  //console.log(req);

  const session = validateSession(req, res);

  console.log('session.user_id');
  console.log(session.user_id);

  console.log('req.body.test');
  // console.log(req.body)

  let userId = session.user_id;
  let coachId = req.body.coachId;

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE)
    .select({
      filterByFormula: `{user_id} = '${userId}'`,
    })
    .all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id;
  }

  try {
    const updatedRecord = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          coach: [coachId],
        },
      },
    ]);

    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
  } catch (error) {
    console.error('Error updating coach relationship:', error);
    throw error;
  }
});

app.post('/update-user', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log('Sending dataaaaaa.');

  const session = validateSession(req, res);

  console.log('session.user_id');
  console.log(session.user_id);

  console.log('req.body.test');
  //console.log(req.body)

  let userId = session.user_id;

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE)
    .select({
      filterByFormula: `{user_id} = '${session.user_id}'`,
    })
    .all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id;
  }

  try {
    const updatedRecord = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          email: req.body.email,
          phone_number: req.body.phone_number,
          found_us: req.body.found_us,
          motivation: req.body.motivation,
          language: req.body.language,
          fprom_tid: req.body.fprom_tid,
          fprom_ref: req.body.fprom_ref,
          utm_campaign: req.body.utm_campaign,
          utm_medium: req.body.utm_medium,
          utm_source: req.body.utm_source,
          utm_term: req.body.utm_term,
          utm_content: req.body.utm_content,
        },
      },
    ]);

    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
  } catch (error) {
    console.error('Error updating user values:', error);
    throw error;
  }
});

app.post('/update-local-storage-sync', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log('Sending dataaaaaa.');

  const session = validateSession(req, res);

  console.log('session.user_id');
  console.log(session.user_id);

  console.log('req.body.test');
  // console.log(req.body.local_storage)

  let userId = session.user_id;

  // Update record in Airtable
  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(REACT_APP_AIRTABLE_TABLE)
    .select({
      filterByFormula: `{user_id} = '${session.user_id}'`,
    })
    .all();

  // If user exists, return the record
  if (existingRecords.length > 0) {
    userId = existingRecords[0].id;
  }

  // Update record in Airtable
  try {
    const response = await base(REACT_APP_AIRTABLE_TABLE).update([
      {
        id: userId,
        fields: {
          local_storage_sync: req.body.local_storage,
        },
      },
    ]);

    res.send({
      status: 'ok',
      data: response[0],
    });
  } catch (error) {
    console.error('Error updating Airtable record:', error);
    throw error;
  }
});
app.post('/clients', async function (request, response) {
  try {
    // Get the current user ID from the session

    const session = validateSession(request, response);

    console.log('session.user_id');
    console.log(session.user_id);

    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    // Set up Airtable connection

    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

    // Set up Airtable connection
    const base = new Airtable({
      apiKey: REACT_APP_AIRTABLE_KEY,
    }).base(REACT_APP_AIRTABLE_BASE);

    const clientRecords = await base(AIRTABLE_TABLES.CLIENTS)
      .select({
        filterByFormula: `FIND('${userId}', {${AIRTABLE_FIELDS.CLIENTS.COACH_USER_ID}})`,
      })
      .all();

    // Transform records into Client entities
    const clientEntities = transformToClientEntities(clientRecords);

    console.log('clientEntities', clientEntities);

    // Return all the clients
    const results = {
      clients: clientEntities,
    };

    response.send({
      status: 'ok',
      data: results,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return response.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

app.use(errorMiddleware);
