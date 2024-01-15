const express = require('express');
const path = require('path');
const crypto = require("crypto");

const app = express();
const PORT = 3000;

let search = '';
let isSearch = false;
let isSeeOnlyFavorites = false;
const todos = [
  {
    id: crypto.randomBytes(16).toString("hex"),
    text: 'Conquer web-world!',
    done: false,
    created: new Date().toISOString(),
    finished: null,
    favorite: false,
  },
  {
    id: crypto.randomBytes(16).toString("hex"),
    text: 'Learn htmx',
    done: false,
    created: new Date().toISOString(),
    finished: null,
    favorite: true,
  },
  {
    id: crypto.randomBytes(16).toString("hex"),
    text: 'Learn node.js',
    done: true,
    created: new Date().toISOString(),
    finished: new Date().toISOString(),
    favorite: false,
  },
]

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/search', (req, res) => {
  search = req.body.search;
  res.send(createTodosList());
});

app.get('/toggle-search', (req, res) => {
  isSearch = !isSearch;
  if (isSearch === false) {
    search = '';
  }
  res.send(sendFilterToggle());
});

app.get('/toggle-only-favorite', (req, res) => {
  isSeeOnlyFavorites = !isSeeOnlyFavorites;
  res.send(createTodosList());
});

app.post('/add', (req, res) => {
  const text = req.body.text.trim();
  if (text) {
    todos.unshift({
      id: crypto.randomBytes(16).toString("hex"),
      text,
      done: false,
      created: new Date().toISOString(),
      finished: null,
      favorite: false,
    });
  }
  res.send(createTodosList());
});

app.post('/delete/:id', (req, res) => {
  const id = req.params.id;
  const index = todos.findIndex(todo => todo.id === id);
  todos.splice(index, 1);
  res.send(createTodosList());
});

app.post('/finish/:id', (req, res) => {
  const id = req.params.id;
  const todo = todos.find(todo => todo.id === id);
  todo.done = true;
  todo.finished = new Date().toISOString();
  res.send(createTodosList());
});

app.post('/unfinish/:id', (req, res) => {
  const id = req.params.id;
  const todo = todos.find(todo => todo.id === id);
  todo.done = false;
  res.send(createTodosList());
});

app.post('/favorite/:id', (req, res) => {
  const id = req.params.id;
  const todo = todos.find(todo => todo.id === id);
  todo.favorite = !todo.favorite;
  res.send(createTodosList());
});

app.get('/todos/all', (req, res) => {
  res.send(createTodosList());
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

// send filer toggle svg icon
const sendFilterToggle = () => {
  if (isSearch) {
    return `
      <form id="search-phrase" hx-post="/search" hx-target="ol" hx-swap="innerHTML transition:true" hx-trigger="keydown delay:500ms">
        <input type="text" name="search" placeholder="Search phrase" autofocus>
      </form>
      
      <fieldset id="only-favorite">
        <label for="favorite">
          <input hx-get="/toggle-only-favorite" hx-target="ol" hx-swap="innerHTML transition:true" type="checkbox" id="favorite" name="favorite" ${isSeeOnlyFavorites && 'checked'}>
          Only favorite
        </label>
      </fieldset>

      <svg id="filter" class="active" hx-get="/toggle-search" hx-target="#filter-wrapper" hx-swap="innerHTML transition:true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#597e8d" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M20 3h-16a1 1 0 0 0 -1 1v2.227l.008 .223a3 3 0 0 0 .772 1.795l4.22 4.641v8.114a1 1 0 0 0 1.316 .949l6 -2l.108 -.043a1 1 0 0 0 .576 -.906v-6.586l4.121 -4.12a3 3 0 0 0 .879 -2.123v-2.171a1 1 0 0 0 -1 -1z" stroke-width="0" fill="currentColor" />
      </svg>
    `;
  }
  return `
    <form id="search-phrase"></form>
    <fieldset id="only-favorite"></fieldset>
    <svg id="filter" hx-get="/toggle-search" hx-target="#filter-wrapper" hx-swap="innerHTML transition:true" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#597e8d" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227z" />
    </svg>
  `;
};

// create list of todo as html li list and add whole htmx magic to it
const createTodosList = () => {
  let filteredTodos = todos;
  if (isSearch !== '') {
    filteredTodos = todos.filter(todo => todo.text.toLowerCase().includes(search.toLowerCase()));
  }

  filteredTodos.sort((a, b) => b.favorite - a.favorite);
  
  if (isSeeOnlyFavorites) {
    filteredTodos = filteredTodos.filter(todo => todo.favorite);
  }

  return filteredTodos.map(todo => `
    <li>
      <div>
        <div hx-post="${todo.done ? 'unfinish' : 'finish'}/${todo.id}" hx-target="ol" hx-swap="innerHTML transition:true">
          <fieldset>
            <input type="checkbox" ${todo.done && 'checked'}>
          </fieldset>
          <hgroup >
            <h6>${todo.done ? `<s>${todo.text}</s>` : todo.text}</h6>
            <p>${todo.done ? `<s>Finished: ${parseISODate(todo.finished)}</s>` : `Created: ${parseISODate(todo.created)}`}</p>
          </hgroup>
        </div>

        <svg hx-post="/favorite/${todo.id}" hx-target="ol" hx-swap="innerHTML transition:true" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffbf00" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" stroke-width="0" fill="${todo.favorite ? '#ffbf00' : 'currentColor'}" />
        </svg>
        <svg hx-post="/delete/${todo.id}" hx-target="ol" hx-swap="innerHTML transition:true" xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16zm-9.489 5.14a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z" stroke-width="0" fill="currentColor" />
          <path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z" stroke-width="0" fill="currentColor" />
        </svg>
      </div>
    </li>
  `).join('');
};

// method to parse ISO date to human readable format
const parseISODate = (date) => {
  const dateObj = new Date(date);
  return `${getLocalMonthName(dateObj)} ${dateObj.getDate()} ${dateObj.getFullYear()} ${dateObj.getHours()}:${dateObj.getMinutes()}`;
};

function getLocalMonthName(date, locale = 'en-US') {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  return formatter.format(date);
};
