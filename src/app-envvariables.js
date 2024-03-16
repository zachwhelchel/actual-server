import express from 'express';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
  next();
});

app.get('/', async (req, res) => {

  console.log("ummmmmmm");

  let REACT_APP_COACH = process.env.REACT_APP_COACH;

  res.send({
    status: 'ok',
    data: { REACT_APP_COACH: REACT_APP_COACH },
  });
});
