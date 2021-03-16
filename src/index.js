const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

const customers = [];

function verifyExistsAccountCPF (request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if(!customer){
    return response.status(400).json({
      error: 'Customer not found',
    });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc += operation.amount;
    } else if (operation.type === 'debit') {
      return acc -= operation.amount;
    }
  }, 0);

  return balance;
}

app.post('/account', (request, response) => {
  const {cpf, name} = request.body;

  const accountAlreadyExists = customers.some((account => account.cpf === cpf));

  if(accountAlreadyExists) {
    return response.status(400).json({
      error: 'Customer already exists!',
    });
  }

  const customer = {
    id: uuidv4(),
    cpf,
    name,
    statement: [],
  }

  customers.push(customer);

  return response.status(201).json(customer);
});

app.get('/statement', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post('/deposit', verifyExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    type: 'credit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdraw', verifyExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({
      error: 'Insufficient funds!',
    });
  }

  const statementOperation = {
    amount,
    type: 'debit',
    created_at: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/date', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + ' 00:00');

  const statement = customer.statement
  .filter(statement =>
    statement.created_at.toDateString() ===
    new Date(dateFormat).toDateString());

  return response.json(statement);
});

app.put('/account', verifyExistsAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  console.log(customer);

  customer.name = name;

  return response.status(201).end();

});

app.get('/account', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/account', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.status(200).json(balance);
});

app.listen('3333', () => {
  console.log('Server is Running 🚀');
});
