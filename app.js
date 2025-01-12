const REGION = "us-east-1";
const USER_POOL_DOMAIN = "us-east-1ub2xooaig.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "58ebvuv78aisa31hbjmrjk0sk0";
const REDIRECT_URI = "http://localhost";
const API_ENDPOINT = "https://g6uom133mh.execute-api.us-east-1.amazonaws.com/prod/todos";

const hostedUiUrl = `https://${USER_POOL_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=email+openid+phone`;
const logoutUrl = `https://${USER_POOL_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;

function showTodoSection() {
    document.getElementById("login-btn").classList.add("hidden");
    document.getElementById("logout-btn").classList.remove("hidden");
    document.getElementById("todo-section").classList.remove("hidden");
}

function login() {
    document.getElementById("login-btn").classList.add("hidden");
    document.getElementById("logout-btn").classList.remove("hidden");
    window.location.href = hostedUiUrl;
}

function logout() {
    document.getElementById("logout-btn").classList.add("hidden");
    document.getElementById("login-btn").classList.remove("hidden");
    document.getElementById("todo-section").classList.add("hidden");
    localStorage.removeItem('tokens');
    window.location.href = logoutUrl;
}


async function getTokensFromCode(authorizationCode) {
    const tokenEndpoint = `https://${USER_POOL_DOMAIN}/oauth2/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", CLIENT_ID);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("code", authorizationCode);

    const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!response.ok) {
        throw new Error("Failed to retrieve tokens");
    }

    const tokens = await response.json();
    localStorage.setItem('tokens', JSON.stringify(tokens));
    return tokens;
}

async function callApi(accessToken) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: "GET",
            headers: {
                Authorization: `${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Your session has expired. Please log in again.");
                login();
                return;
            }
            throw new Error("Failed to call API");
        }

        const data = await response.json();
        renderTodos(data);
    } catch (error) {
        console.error("API call error:", error);
    }
}

async function handleRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const authorizationCode = urlParams.get("code");

    const cachedTokensString = localStorage.getItem('tokens');
    let cachedTokens = cachedTokensString ? JSON.parse(cachedTokensString) : null;

    if (cachedTokens && cachedTokens.access_token) {
        await callApi(cachedTokens.access_token);
        showTodoSection();
    } else if (authorizationCode) {
        try {
            const tokens = await getTokensFromCode(authorizationCode);
            await callApi(tokens.access_token);
            showTodoSection();
        } catch (error) {
            console.error("Error during redirect handling:", error);
        }
    } else {
        login();
    }
}

function showTodoSection() {
    document.getElementById("login-btn").classList.add("hidden");
    document.getElementById("logout-btn").classList.remove("hidden");
    const todoSection = document.getElementById("todo-section");
    todoSection.classList.remove("hidden");
    todoSection.classList.add("animate__animated", "animate__fadeIn");
}

async function fetchTodos() {
    const cachedTokensString = localStorage.getItem('tokens');
    if (!cachedTokensString) {
        alert("Please log in to view todos.");
        login();
        return;
    }

    const tokens = JSON.parse(cachedTokensString);
    const accessToken = tokens.access_token;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Your session has expired. Please log in again.");
                login();
                return;
            }
            throw new Error("Failed to fetch todos");
        }

        const data = await response.json();
        renderTodos(data);
    } catch (error) {
        console.error("Fetch todos error:", error);
    }
}

function renderTodos(todos) {
    const todoList = document.getElementById("todo-list");
    todoList.innerHTML = "";

    todos.forEach(todo => {
        const li = document.createElement("li");
        li.classList.add(
            "p-4",
            "bg-white",
            "rounded-lg",
            "shadow-md",
            "flex",
            "justify-between",
            "items-center",
            "transition",
            "duration-300",
            "ease-in-out",
            "hover:shadow-lg",
            "transform",
            "hover:scale-105",
            "hover:bg-indigo-50"
        );
        li.setAttribute("data-id", todo.id);

        // Checkbox for marking completion
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!todo.completedAt; // Check if completedAt is not null
        checkbox.classList.add("mr-4", "w-5", "h-5", "text-indigo-600", "rounded");
        checkbox.onclick = () => toggleTodoCompletion(todo);

        // Todo text container
        const textContainer = document.createElement("div");
        textContainer.classList.add("flex", "flex-col", "flex-grow");

        // Todo title (strikethrough if completed)
        const todoText = document.createElement("span");
        todoText.classList.add("text-lg", "font-semibold", "text-gray-800");
        if (todo.completedAt) {
            todoText.classList.add("line-through", "text-gray-500");
        }
        todoText.textContent = todo.title;

        // Show createdAt and completedAt dates
        const createdAt = new Date(todo.createdAt);
        const formattedCreatedAt = new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(createdAt);

        const todoDate = document.createElement("span");
        todoDate.classList.add("text-sm", "text-gray-500");
        todoDate.textContent = `Created on: ${formattedCreatedAt}`;

        // Show completed date if completed
        if (todo.completedAt) {
            const completedAt = new Date(todo.completedAt);
            const formattedCompletedAt = new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
            }).format(completedAt);

            const completedDate = document.createElement("span");
            completedDate.classList.add("text-sm", "text-green-500");
            completedDate.textContent = `Completed on: ${formattedCompletedAt}`;
            textContainer.appendChild(completedDate);
        }

        // Append elements to text container
        textContainer.appendChild(todoText);
        textContainer.appendChild(todoDate);

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add(
            "ml-4",
            "text-red-500",
            "hover:text-red-700",
            "transition",
            "duration-200",
            "ease-in-out"
        );
        deleteBtn.onclick = () => deleteTodo(todo.id);

        // Append everything to list item
        li.appendChild(checkbox);
        li.appendChild(textContainer);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

async function toggleTodoCompletion(todo) {
    const cachedTokensString = localStorage.getItem("tokens");
    if (!cachedTokensString) {
      alert("Please log in to update todos.");
      login();
      return;
    }
  
    const tokens = JSON.parse(cachedTokensString);
    const accessToken = tokens.access_token;
  
    // If `completedAt` is null, set it to the current time; otherwise, set it back to null
    const updatedCompletedAt = todo.completedAt ? null : new Date().toISOString();
  
    try {
      const response = await fetch(`${API_ENDPOINT}/${todo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ...todo, completedAt: updatedCompletedAt }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update todo");
      }
  
      const updatedTodo = await response.json();
  
      // Update the UI with the new todo state
      fetchTodos(); // Refetch todos to ensure the list is updated
    } catch (error) {
      console.error("Error toggling todo completion:", error);
    }
  }
  


async function addTodo() {
    const todoInput = document.getElementById("todo-input");
    const todoTitle = todoInput.value.trim();
    if (!todoTitle) return;

    const cachedTokensString = localStorage.getItem('tokens');
    if (!cachedTokensString) {
        alert("Please log in to add todos.");
        login();
        return;
    }

    const tokens = JSON.parse(cachedTokensString);
    const accessToken = tokens.access_token;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${accessToken}`,
            },
            body: JSON.stringify({ title: todoTitle }),
        });

        if (!response.ok) {
            throw new Error("Failed to add todo");
        }

        const newTodo = await response.json();
        renderTodos([newTodo, ...document.getElementById("todo-list").querySelectorAll("li").map(li => ({ title: li.textContent.split(" ")[0] }))]);
        todoInput.value = "";
    } catch (error) {
        console.error("Add todo error:", error);
    }
}

async function deleteTodo(todoId) {
    const cachedTokensString = localStorage.getItem('tokens');
    if (!cachedTokensString) {
        alert("Please log in to delete todos.");
        login();
        return;
    }

    const tokens = JSON.parse(cachedTokensString);
    const accessToken = tokens.access_token;

    try {
        const response = await fetch(`${API_ENDPOINT}/${todoId}`, {
            method: "DELETE",
            headers: {
                Authorization: `${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete todo");
        }

        const todoElement = document.querySelector(`li[data-id="${todoId}"]`);
        if (todoElement) {
            todoElement.remove();
        }
    } catch (error) {
        console.error("Delete todo error:", error);
    }
}

window.login = login;
window.logout = logout;

document.getElementById("add-todo-btn").addEventListener("click", addTodo);

handleRedirect();
