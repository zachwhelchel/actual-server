import { getSession } from '../account-db.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export default function validateUser(req, res) {
  let { token } = req.body || {};

  console.log('whyme A' + token);

  if (!token) {
    token = req.headers['x-actual-token'];
  }

  console.log('whyme B' + token);

  let session = getSession(token);

  console.log('whyme C' + session);

  if (!session) {
    res.status(401);
    res.send({
      status: 'error',
      reason: 'unauthorized',
      details: 'token-not-found',
    });
    return null;
  }

  return session;
}
