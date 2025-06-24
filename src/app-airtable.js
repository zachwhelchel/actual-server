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
  constructor(
    recordId,
    userId,
    coachUserId,
    userIdsSharedWith,
    name,
    status,
    statusExpiresAt,
    joinedAt,
    lastShareRequestedAt,
    email,
    phone,
    coachNotes,
    lastVisitedBudgetSmallScreen,
    lastVisitedBudgetLargeScreen,
    lastChangedBudgetedAmount,
    lastSyncedAccount,
    lastInteractedWithAvatar,
    lastEditedTransaction,
    lastAddedAccount,
    lastAddedCategory,
    nextMeetingDate,
    address,
    city,
    state,
    zip,
    timezone,
    contactPreference,
    leadSource,
    budgetingPlatform,
    partnerFirstName,
    partnerLastName,
    partnerEmail,
    partnerPhoneNumber,
  ) {
    this.recordId = recordId;
    this.userId = userId;
    this.coachUserId = coachUserId;
    this.userIdsSharedWith = userIdsSharedWith;
    this.name = name;
    this.status = status;
    this.statusExpiresAt = statusExpiresAt;
    this.joinedAt = joinedAt;
    this.lastShareRequestedAt = lastShareRequestedAt;
    this.email = email;
    this.phone = phone;
    this.coachNotes = coachNotes;
    this.lastVisitedBudgetSmallScreen = lastVisitedBudgetSmallScreen;
    this.lastVisitedBudgetLargeScreen = lastVisitedBudgetLargeScreen;
    this.lastChangedBudgetedAmount = lastChangedBudgetedAmount;
    this.lastSyncedAccount = lastSyncedAccount;
    this.lastInteractedWithAvatar = lastInteractedWithAvatar;
    this.lastEditedTransaction = lastEditedTransaction;
    this.lastAddedAccount = lastAddedAccount;
    this.lastAddedCategory = lastAddedCategory;
    this.nextMeetingDate = nextMeetingDate;
    this.address = address;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.timezone = timezone;
    this.contactPreference = contactPreference;
    this.leadSource = leadSource;
    this.budgetingPlatform = budgetingPlatform;
    this.partnerFirstName = partnerFirstName;
    this.partnerLastName = partnerLastName;
    this.partnerEmail = partnerEmail;
    this.partnerPhoneNumber = partnerPhoneNumber;
  }
}

const AIRTABLE_TABLES = {
  ACCOUNTS: 'Accounts',
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
    USER_ID: 'account_user_id',
    USER_IDS_SHARED_WITH: 'account_user_ids_shared_with',
    LAST_SHARE_REQUESTED_AT: 'last_share_requested_at',
    EMAIL: 'client_email',
    PHONE: 'client_phone_number',
    COACH_NOTES: 'coach_notes',
    LAST_VISITED_BUDGET_SMALL_SCREEN: 'last_visited_budget_small_screen',
    LAST_VISITED_BUDGET_LARGE_SCREEN: 'last_visited_budget_large_screen',
    LAST_CHANGED_BUDGETED_AMOUNT: 'last_changed_budgeted_amount',
    LAST_SYNCED_ACCOUNT: 'last_synced_account',
    LAST_INTERACTED_WITH_AVATAR: 'last_interacted_with_avatar',
    LAST_EDITED_TRANSACTION: 'last_edited_transaction',
    LAST_ADDED_ACCOUNT: 'last_added_account',
    LAST_ADDED_CATEGORY: 'last_added_category',
    NEXT_MEETING_DATE: 'next_meeting_date',
    ADDRESS: 'address',
    CITY: 'city',
    STATE: 'state',
    ZIP: 'zip',
    TIMEZONE: 'timezone',
    CONTACT_PREFERENCE: 'contact_preference',
    LEAD_SOURCE: 'lead_source',
    BUDGETING_PLATFORM: 'budgeting_platform',
    PARTNER_FIRST_NAME: 'partner_first_name',
    PARTNER_LAST_NAME: 'partner_last_name',
    PARTNER_EMAIL: 'partner_email',
    PARTNER_PHONE_NUMBER: 'partner_phone_number',
  },
  NEW_CLIENT: {
    FIRST_NAME: 'non_account_first',
    LAST_NAME: 'non_account_last',
    EMAIL: 'non_account_email',
    PHONE: 'non_account_phone_number',
    STATUS: 'non_account_status',
    COACH_NOTES: 'coach_notes',
    NON_ACCOUNT_COACH: 'non_account_coach',
    NEXT_MEETING_DATE: 'next_meeting_date',
  },
  USERS: {},
  COACHES: {},
};

// Function to transform Airtable records into Client entities
function transformToClientEntities(records) {
  return records.map((record) => {
    const fields = record.fields;
    // USER_IDS_SHARED_WITH that looks like an array in Airtable is a JSON string representation of an Array.
    let parsedSharedWith;
    try {
      parsedSharedWith =
        fields[AIRTABLE_FIELDS.CLIENTS.USER_IDS_SHARED_WITH] &&
        fields[AIRTABLE_FIELDS.CLIENTS.USER_IDS_SHARED_WITH].length
          ? JSON.parse(fields[AIRTABLE_FIELDS.CLIENTS.USER_IDS_SHARED_WITH][0])
          : [];
    } catch (error) {
      console.log(
        `Error parsing ${AIRTABLE_FIELDS.CLIENTS.USER_IDS_SHARED_WITH}:`,
        fields[AIRTABLE_FIELDS.CLIENTS.USER_IDS_SHARED_WITH],
        error,
      );
      parsedSharedWith = [];
    }

    // Whether we need to dereference with [0] depends on
    //  if the data is a Lookup field into another table.
    return new Client(
      record.id,
      fields[AIRTABLE_FIELDS.CLIENTS.USER_ID]
        ? fields[AIRTABLE_FIELDS.CLIENTS.USER_ID][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.COACH_USER_ID]
        ? fields[AIRTABLE_FIELDS.CLIENTS.COACH_USER_ID][0]
        : null,
      parsedSharedWith?.length ? parsedSharedWith : [],
      fields[AIRTABLE_FIELDS.CLIENTS.NAME]
        ? (Array.isArray(fields[AIRTABLE_FIELDS.CLIENTS.NAME]) 
            ? fields[AIRTABLE_FIELDS.CLIENTS.NAME][0] 
            : fields[AIRTABLE_FIELDS.CLIENTS.NAME])
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.STATUS],
      fields[AIRTABLE_FIELDS.CLIENTS.STATUS_EXPIRES_AT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.STATUS_EXPIRES_AT][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.JOINED_AT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.JOINED_AT][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_SHARE_REQUESTED_AT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_SHARE_REQUESTED_AT]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.EMAIL]
        ? fields[AIRTABLE_FIELDS.CLIENTS.EMAIL]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.PHONE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.PHONE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.COACH_NOTES]
        ? fields[AIRTABLE_FIELDS.CLIENTS.COACH_NOTES]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_VISITED_BUDGET_SMALL_SCREEN]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_VISITED_BUDGET_SMALL_SCREEN][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_VISITED_BUDGET_LARGE_SCREEN]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_VISITED_BUDGET_LARGE_SCREEN][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_CHANGED_BUDGETED_AMOUNT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_CHANGED_BUDGETED_AMOUNT][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_SYNCED_ACCOUNT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_SYNCED_ACCOUNT][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_INTERACTED_WITH_AVATAR]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_INTERACTED_WITH_AVATAR][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_EDITED_TRANSACTION]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_EDITED_TRANSACTION][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_ADDED_ACCOUNT]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_ADDED_ACCOUNT][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LAST_ADDED_CATEGORY]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LAST_ADDED_CATEGORY][0]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.NEXT_MEETING_DATE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.NEXT_MEETING_DATE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.ADDRESS]
        ? fields[AIRTABLE_FIELDS.CLIENTS.ADDRESS]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.CITY]
        ? fields[AIRTABLE_FIELDS.CLIENTS.CITY]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.STATE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.STATE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.ZIP]
        ? fields[AIRTABLE_FIELDS.CLIENTS.ZIP]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.TIMEZONE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.TIMEZONE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.CONTACT_PREFERENCE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.CONTACT_PREFERENCE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.LEAD_SOURCE]
        ? fields[AIRTABLE_FIELDS.CLIENTS.LEAD_SOURCE]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.BUDGETING_PLATFORM]
        ? fields[AIRTABLE_FIELDS.CLIENTS.BUDGETING_PLATFORM]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_FIRST_NAME]
        ? fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_FIRST_NAME]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_LAST_NAME]
        ? fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_LAST_NAME]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_EMAIL]
        ? fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_EMAIL]
        : null,
      fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_PHONE_NUMBER]
        ? fields[AIRTABLE_FIELDS.CLIENTS.PARTNER_PHONE_NUMBER]
        : null,
    );
  });
}

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
            coach_selection_source: req.body.coachSelectionSource,
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


app.post('/update-analytics', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  const session = validateSession(req, res);

  let userId = null;


  console.log('update-analytics')
  console.log(req.body)

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  try {
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
              last_visited_budget_small_screen: req.body.last_visited_budget_small_screen,
              last_visited_budget_large_screen: req.body.last_visited_budget_large_screen,
              last_changed_budgeted_amount: req.body.last_changed_budgeted_amount,
              last_synced_account: req.body.last_synced_account,
              last_interacted_with_avatar: req.body.last_interacted_with_avatar,
              last_edited_transaction: req.body.last_edited_transaction,
              last_added_account: req.body.last_added_account,
              last_added_category: req.body.last_added_category,
            },
          },
        ]);

        res.send({
          status: 'ok',
        });
      } catch (error) {
        console.error('Error updating user analytics:', error);
        throw error;
      }

  } catch (error) {
    console.error('Failed to updating user analytics:', error);
    // Return original record if transformation fails
    return null;
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
  let coachSelectionSource = req.body.coachSelectionSource;

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
          coach_selection_source: coachSelectionSource,
        },
      },
    ]);

    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
  } catch (error) {
    console.error('Error updating coach relationship:', error);
    console.error('Error updating coach relationship:', req.body);
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
          share_contact_with_coach: req.body.share_contact_with_coach,
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

    let transformed = await transformCoachPhoto(updatedRecord[0]);
    res.send({
      status: 'ok',
      data: transformed,
    });
    
  } catch (error) {
    console.error('Error updating user values:', error);
    throw error;
  }
});

app.post('/invite-to-share', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  const session = validateSession(req, res);

  console.log('[airtable][invite-to-share] session.user_id', session.user_id);

  let clientUserId = req.body.clientUserId;
  let coachUserId = req.body.coachUserId;
  console.log('[airtable][invite-to-share] clientUserId', clientUserId);
  console.log('[airtable][invite-to-share] coachUserId', coachUserId);
  if (coachUserId != session.user_id) {
    throw new Error(
      '[airtable][invite-to-share] Unauthorized access, session user_id does not match coach user_id',
    );
  }

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingRecords = await base(AIRTABLE_TABLES.CLIENTS)
    .select({
      filterByFormula: `{account_user_id} = '${clientUserId}'`,
    })
    .all();

  // If too many matches, then the data is ambiguous
  if (existingRecords.length > 1) {
    throw new Error('[airtable][invite-to-share] Ambiguous client user_id');
  }

  let clientId;
  // If client exists, return the record
  if (existingRecords.length > 0) {
    clientId = existingRecords[0].id;
  } else {
    throw new Error('[airtable][invite-to-share] Invalid client user_id');
  }

  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const updatedRecord = await base(AIRTABLE_TABLES.CLIENTS).update([
      {
        id: clientId,
        fields: {
          last_share_requested_at: currentDate,
        },
      },
    ]);

    res.send({
      status: 'ok',
      data: updatedRecord[0],
    });
  } catch (error) {
    console.error(
      '[airtable][invite-to-share] Error updating last_share_requested_at:',
      error,
    );
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

// API Route: /airtable/clients
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

//could be tightened up to check you are the coach for this client first.
app.post('/update-internal-client', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  const session = validateSession(req, res);

  const nextMeetingDate = req.body.nextMeetingDate || null;

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  try {
    const updatedRecord = await base(AIRTABLE_TABLES.CLIENTS).update([
      {
        id: req.body.clientId,
        fields: {
          coach_notes: req.body.coachNotes,
          next_meeting_date: nextMeetingDate,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          timezone: req.body.timezone,
          contact_preference: req.body.contactPreference || null,
          lead_source: req.body.leadSource,
          partner_first_name: req.body.partnerFirstName,
          partner_last_name: req.body.partnerLastName,
          partner_email: req.body.partnerEmail,
          partner_phone_number: req.body.partnerPhoneNumber,
        },
      },
    ]);

    res.send({
      status: 'ok',
    });
    
  } catch (error) {
    console.error('Error updating client values:', error);
    throw error;
  }
});

//could be tightened up to check you are the coach for this client first.
app.post('/update-external-client', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  const session = validateSession(req, res);

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  console.log(req.body);
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const phone = req.body.phone;
  const status = req.body.status;
  const coachNotes = req.body.coachNotes;
  const nextMeetingDate = req.body.nextMeetingDate || null;

  try {
    const updatedRecord = await base(AIRTABLE_TABLES.CLIENTS).update([
      {
        id: req.body.clientId,
        fields: {
          [AIRTABLE_FIELDS.NEW_CLIENT.FIRST_NAME]: firstName,
          [AIRTABLE_FIELDS.NEW_CLIENT.LAST_NAME]: lastName,
          [AIRTABLE_FIELDS.NEW_CLIENT.EMAIL]: email,
          [AIRTABLE_FIELDS.NEW_CLIENT.PHONE]: phone,
          [AIRTABLE_FIELDS.NEW_CLIENT.STATUS]: status,
          [AIRTABLE_FIELDS.NEW_CLIENT.COACH_NOTES]: coachNotes,
          [AIRTABLE_FIELDS.NEW_CLIENT.NEXT_MEETING_DATE]: nextMeetingDate,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zip: req.body.zip,
          timezone: req.body.timezone,
          contact_preference: req.body.contactPreference || null,
          lead_source: req.body.leadSource,
          budgeting_platform: req.body.budgetingPlatform || null,
          partner_first_name: req.body.partnerFirstName,
          partner_last_name: req.body.partnerLastName,
          partner_email: req.body.partnerEmail,
          partner_phone_number: req.body.partnerPhoneNumber,
        },
      },
    ]);

    res.send({
      status: 'ok',
    });
    
  } catch (error) {
    console.error('Error updating client values:', error);
    throw error;
  }
});

//could be tightened up to check you are the coach for this client first.
app.post('/delete-external-client', async (req, res) => {

  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  const session = validateSession(req, res);

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  console.log(req.body);

  try {
    const deletedRecord = await base(AIRTABLE_TABLES.CLIENTS).destroy([
      req.body.clientId
    ]);

    res.send({
      status: 'ok',
    });
    
  } catch (error) {
    console.error('Error updating client values:', error);
    throw error;
  }
});

// API Route: /airtable/create-client
app.post('/create-client', async function (request, response) {
  try {
    // Get the current user ID from the session

    const session = validateSession(request, response);

    console.log('session.user_id');
    console.log(session.user_id);

    const userId = session.user_id;

    if (!userId) {
      return response.status(401).json({ error: 'User not authenticated' });
    }

    console.log(request.body);
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const email = request.body.email;
    const phone = request.body.phone;
    const status = request.body.status;
    const coachNotes = request.body.coachNotes;
    const nextMeetingDate = request.body.nextMeetingDate || null;

    // Set up Airtable connection
    let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
    let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

    // Set up Airtable connection
    const base = new Airtable({
      apiKey: REACT_APP_AIRTABLE_KEY,
    }).base(REACT_APP_AIRTABLE_BASE);

    const existingCoachRecords = await base(AIRTABLE_TABLES.COACHES)
      .select({
        filterByFormula: `{Associated Account User Id} = '${userId}'`,
      })
      .all();

    let coachRecordId;
    // If user exists, return the record
    if (existingCoachRecords.length > 0) {
      coachRecordId = existingCoachRecords[0].id;
    }

    if (!coachRecordId) {
      return response.status(401).json({ error: 'Coach record not found' });
    }

    const newRecord = await base(AIRTABLE_TABLES.CLIENTS).create([
      {
        fields: {
          [AIRTABLE_FIELDS.NEW_CLIENT.FIRST_NAME]: firstName,
          [AIRTABLE_FIELDS.NEW_CLIENT.LAST_NAME]: lastName,
          [AIRTABLE_FIELDS.NEW_CLIENT.EMAIL]: email,
          [AIRTABLE_FIELDS.NEW_CLIENT.PHONE]: phone,
          [AIRTABLE_FIELDS.NEW_CLIENT.STATUS]: status,
          [AIRTABLE_FIELDS.NEW_CLIENT.COACH_NOTES]: coachNotes,
          [AIRTABLE_FIELDS.NEW_CLIENT.NON_ACCOUNT_COACH]: [coachRecordId],
          [AIRTABLE_FIELDS.NEW_CLIENT.NEXT_MEETING_DATE]: nextMeetingDate,
          address: request.body.address,
          city: request.body.city,
          state: request.body.state,
          zip: request.body.zip,
          timezone: request.body.timezone,
          contact_preference: request.body.contactPreference || null,
          lead_source: request.body.leadSource,
          budgeting_platform: request.body.budgetingPlatform || null,
          partner_first_name: request.body.partnerFirstName,
          partner_last_name: request.body.partnerLastName,
          partner_email: request.body.partnerEmail,
          partner_phone_number: request.body.partnerPhoneNumber,
        },
      },
    ]);

    // Return the new client
    const results = {
      client: newRecord,
    };

    response.send({
      status: 'ok',
      data: results,
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return response.status(500).json({ error: 'Failed to create client' });
  }
});

app.post('/sponsor-client', async (req, res) => {
  let REACT_APP_AIRTABLE_BASE = process.env.REACT_APP_AIRTABLE_BASE;
  let REACT_APP_AIRTABLE_TABLE = process.env.REACT_APP_AIRTABLE_TABLE;
  let REACT_APP_AIRTABLE_KEY = process.env.REACT_APP_AIRTABLE_KEY;

  console.log('Sending dataaaaaa.');
  console.log(req.body.accountId);

  const session = validateSession(req, res);

  console.log('session.user_id');
  console.log(session.user_id);

  //console.log('req.body.test')
  //console.log(req.body)

  const base = new Airtable({
    apiKey: REACT_APP_AIRTABLE_KEY,
  }).base(REACT_APP_AIRTABLE_BASE);

  const existingUserRecords = await base(REACT_APP_AIRTABLE_TABLE)
    .select({
      filterByFormula: `{user_id} = '${req.body.accountId}'`,
    })
    .all();

  const existingCoachRecords = await base(REACT_APP_AIRTABLE_TABLE)
    .select({
      filterByFormula: `{user_id} = '${session.user_id}'`,
    })
    .all();

  // If user exists, return the record
  if (existingUserRecords.length > 0) {
    const recordId = existingUserRecords[0].id;
    const userId = existingUserRecords[0].get('user_id');
    let expiryDate = existingUserRecords[0].get('status_expires_at');
    let name = existingUserRecords[0].get('first_last_initial');

    // If no date exists, create today's date in YYYY-MM-DD format
    if (!expiryDate) {
      const today = new Date();
      expiryDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    }

    // Parse the string date, ensuring we preserve the day
    let dateParts = expiryDate.split('-'); // Split YYYY-MM-DD
    let dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

    let reason = null;

    // Add time based on sponsorship length
    if (req.body.sponsorshipLength === '1_month') {
      dateObj.setMonth(dateObj.getMonth() + 1);
      reason = 'sponsored_client_1_month';
    } else if (req.body.sponsorshipLength === '3_months') {
      dateObj.setMonth(dateObj.getMonth() + 3);
      reason = 'sponsored_client_3_months';
    } else if (req.body.sponsorshipLength === '5_months') {
      dateObj.setMonth(dateObj.getMonth() + 5);
      reason = 'sponsored_client_5_months';
    } else if (req.body.sponsorshipLength === '1_year') {
      dateObj.setFullYear(dateObj.getFullYear() + 1);
      reason = 'sponsored_client_1_year';
    }

    // Convert back to YYYY-MM-DD string format
    const newExpiryDate = dateObj.toLocaleDateString('en-CA');

    try {
      const updatedRecord = await base(REACT_APP_AIRTABLE_TABLE).update([
        {
          id: recordId,
          fields: {
            status_expires_at: newExpiryDate,
            status: 'sponsored',
          },
        },
      ]);

      const notes = name + ' ' + userId;

      const coachRecordId = existingCoachRecords[0].id;
      const newRecord = await base('Invoicing').create([
        {
          fields: {
            Account: [coachRecordId],
            Reason: reason,
            Notes: notes,
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
  }
});

app.use(errorMiddleware);
