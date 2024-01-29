const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dataBasePath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: `http://localhost:3000/`");
    });
  } catch (error) {
    console.log(`Data Base Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// Functions to validate params
const hasPriorityAndStatus = (queryObj) => {
  return queryObj.priority !== undefined && queryObj.status !== undefined;
};

const hasPriority = (queryObj) => {
  return queryObj.priority !== undefined;
};

const hasStatus = (queryObj) => {
  return queryObj.status !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let todoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatus(request.query):
      todoQuery = `
              SELECT 
                *
              FROM todo
              WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      todoQuery = `
              SELECT 
                *
              FROM todo
              WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      todoQuery = `
              SELECT 
                *
              FROM todo
              WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    default:
      todoQuery = `
              SELECT 
                *
              FROM todo
              WHERE
                todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(todoQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoQuery = `
    SELECT 
      *
    FROM todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(todoQuery);
  response.send(todo);
});

//API 3 create new values into the table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
    INSERT INTO 
      todo(id, todo, priority, status)
    VALUES
      (
        ${id},'${todo}', '${priority}', '${status}'
      );`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateRequest = request.body;
  let column = "";
  switch (true) {
    case updateRequest.status !== undefined:
      column = "Status";
      break;
    case updateRequest.priority !== undefined:
      column = "Priority";
      break;
    case updateRequest.todo !== undefined:
      column = "Todo";
      break;
  }
  const getQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const todoIs = await db.get(getQuery);
  const {
    todo = todoIs.todo,
    priority = todoIs.priority,
    status = todoIs.status,
  } = request.body;
  const putTodoQuery = `
    UPDATE 
      todo
    SET 
        id = ${todoId},
        todo='${todo}', 
        priority='${priority}', 
        status='${status}'
    WHERE
      id = ${todoId};`;
  await db.run(putTodoQuery);
  response.send(`${column} Updated`);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
        DELETE FROM
          todo
        WHERE
          id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});
module.exports = app;
