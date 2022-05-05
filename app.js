const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var isValid = require("date-fns/isValid");
var format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return request.category !== undefined && request.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return request.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return request.category !== undefined && request.priority !== undefined;
};


const statusValid = (requestBody) => {
    if(requestBody.status === "TO DO" || requestBody.status === "IN PROGRESS" || requestBody.status === "DONE"){
        return true;
    }else{
    response.status(400);
    response.send("Invalid Todo Status");
    }

};

const priorityValid = (requestBody) => {
    if(requestBody.priority === "HIGH" || requestBody.priority === "MEDIUM" || requestBody.priority === "LOW"){
        return true;
    }else{
    response.status(400);
    response.send("Invalid Todo Priority");
    }

};

const categoryValid = (requestBody) => {
    if(requestBody.category === "WORK" || requestBody.category === "HOME" || requestBody.category === "LEARNING"){
        return true;
    }else{
        response.status(400);
        response.send("Invalid Todo Category");
    }

};



app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, dueDate } = request.query;
 

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):

      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND status = '${status}';`;

      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;

      break;

    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
        *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;

      break;

    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if(isValid(date) === true){
   
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = ${newDate};`;
    const todo = await database.get(getTodoQuery);
    response.send(todo);
  }else{
      response.status(400);
      response.send("Invalid Due Date");
  }
  
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

    const statusCheck = statusValid(requestBody);
    const priorityCheck = priorityValid(requestBody);
    const categoryCheck = categoryValid(requestBody);

    if(statusCheck === true && priorityCheck===true && categoryCheck === true){
        const postTodoQuery = `
        INSERT INTO
            todo (id, todo, priority, status, category, due_date)
        VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate});`;
        await database.run(postTodoQuery);
        response.send("Todo Successfully Added");
    }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const statusCheck = statusValid(requestBody);
  const priorityCheck = priorityValid(requestBody);
  const categoryCheck = categoryValid(requestBody);


  if(statusCheck === true && priorityCheck === true && categoryCheck === true){

    const previousTodoQuery = `
        SELECT
        *
        FROM
        todo
        WHERE 
        id = ${todoId};`;
    const previousTodo = await database.get(previousTodoQuery);

    const {
        todo = previousTodo.todo,
        priority = previousTodo.priority,
        status = previousTodo.status,
        category = previousTodo.category,
        dueDate = previousTodo.dueDate,
    } = request.body;

    const updateTodoQuery = `
        UPDATE
        todo
        SET
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category = '${category}',
        due_date = '${dueDate}'
        WHERE
        id = ${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
    });
  }



app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
