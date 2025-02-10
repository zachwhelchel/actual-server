import express from 'express';

const app = express();

export { app as handlers };
app.use(express.json());

app.use(async (req, res, next) => {
  next();
});

app.get('/', async (req, res) => {

  console.log("Sending data.");

  res.send({
    status: 'ok',
    data: { 
      data: 'data' 
    },
  });
});
