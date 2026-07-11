const express = require("express")
const app = express()

app.use(express.json()) // without the json-parser middleware, the request.body property would be undefined. The json-parser takes the JSON data of a request, transforms it into a JavaScript object and then attaches it to the body property of the request object before route handler is called.

app.use(express.static("dist"))

const morgan = require("morgan") // https://github.com/expressjs/morgan

morgan.token("body", (request) => JSON.stringify(request.body))

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
)

const cors = require("cors")

app.use(cors())

let persons = [
  {
    id: "1",
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: "2",
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: "3",
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: "4",
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
]

app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>")
})

app.get("/info", (request, response) => {
  response.send(
    `<p>Phonebook has info for ${persons.length} people</p><br><p>${new Date()}</p>`,
  )
})

app.get("/api/persons", (request, response) => {
  response.json(persons)
})

// route per fetching singola risorsa

app.get("/api/persons/:id", (request, response) => {
  const id = request.params.id
  const person = persons.find((person) => person.id === id)

  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

app.delete("/api/persons/:id", (request, response) => {
  const id = request.params.id
  persons = persons.filter((person) => person.id !== id)

  response.status(204).end()
})

const generateId = () => {
  const maxId =
    persons.length > 0 ? Math.max(...persons.map((n) => Number(n.id))) : 0
  return String(maxId + 1)
}

app.post("/api/persons", (request, response) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: "content missing",
    })
  } else if (
    persons.map((person) => person.name).find((name) => name === body.name)
  ) {
    return response.status(400).json({
      error: "utente già esistente",
    })
  } // elseif non esiste in JS, ma qui if è innestato in else, essendo solo una riga non servono {}

  const person = {
    name: body.name,
    number: body.number,
    id: generateId(),
  }

  persons = persons.concat(person)

  response.json(person)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" }) // response.send() and response.json() methods are identical when an object or array is passed, but response.json() will also convert non-objects, such as null and undefined, which are not valid JSON.
}

app.use(unknownEndpoint) // middleware functions have to be used before routes when we want them to be executed by the route event handlers. Sometimes, we want to use middleware functions after routes. We do this when middleware functions are only called if no route handler processes the HTTP request. This middleware will be used for catching requests made to non-existent routes. For these requests, the middleware will return an error message in JSON format.

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
