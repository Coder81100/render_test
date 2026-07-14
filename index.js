require("dotenv").config() // deve essere importato prima del modello person
const express = require("express")
const morgan = require("morgan") // https://github.com/expressjs/morgan
const Person = require("./models/person")

const app = express()

// ordine in cui si dichiarano middleware è importante: express.json() deve essere tra i primi in modo che request.body sia disponibile per logger e routes. unknownEndpoint deve venire dopo ogni route o prenderà richieste che non deve, deve venire solo prima di errorHandler

app.use(express.static("dist"))
app.use(express.json()) // without json-parser middleware, the request.body property would be undefined. json-parser takes the JSON data of a request, transforms it into a JavaScript object and then attaches it to the body property of the request object before route handler is called

morgan.token("body", (request) => JSON.stringify(request.body))

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms :body"),
)

// const cors = require("cors")

// app.use(cors()), serve quando richiesta da parte del JS nel browser non è a stessa fonte del file HTML di origine. Non necessario quando versione di produzione è pronta visto che la cartella dist è nella cartella del backend, e quando per versione di sviluppo si fa apposita aggiunta a vite.config.js che fa agire ambiente di sviluppo React da proxy (usando link relativo in services/people.js), solo per richieste a /api, ovvero al backend, quelle al frontend non subiscono redirect, infatti frontend è in localhost:5173 (backend è in :3001). Si può rimuovere dipendenza (npm remove cors), non fatto per lasciare intatto riferimento

// nell'ultima versione, le persone vengono prese dal database MongoDB, questo array non serve

/* let people = [
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
] */

app.get("/", (request, response) => {
  response.send("<h1>Hello World!</h1>")
})

app.get("/info", (request, response) => {
  Person.find({}).then((people) => {
    response.send(
      `
      <p>Phonebook has info for ${people.length} people</p>
      <br>
      <p>${new Date()}</p>
      `,
    )
  })
})

/* app.get("/api/persons", (request, response) => {
  response.json(people)
}) */

app.get("/api/people", (request, response) => {
  Person.find({}).then((people) => {
    response.json(people)
  })
})

// route per fetching singola risorsa

app.get("/api/people/:id", (request, response, next) => {
  /* const id = request.params.id
  const person = people.find((person) => person.id === id)

  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  } */

  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(
      (error) => next(error),
      // console.log(error)
      // response.status(400).send({ error: "malformatted id" })
    )
})

// if next was called without argument, the execution would move onto the next route or middleware. If called with argument, the execution will continue to the error handler middleware

app.delete("/api/people/:id", (request, response, next) => {
  /* const id = request.params.id
  people = people.filter((person) => person.id !== id)

  response.status(204).end() */

  Person.findByIdAndDelete(request.params.id)
    .then((person) => {
      response.status(204).end() // che persona esista o meno. result callback parameter could be used for checking if resource was actually deleted, and use that for returning different codes if necessary
    })
    .catch((error) => next(error))
})

/* const generateId = () => {
  const maxId =
    people.length > 0 ? Math.max(...people.map((n) => Number(n.id))) : 0
  return String(maxId + 1)
} */
// (id creato da MongoDB)

app.post("/api/people", (request, response, next) => {
  const body = request.body

  /* if (!body.name || !body.number) {
    return response.status(400).json({
      error: "name or number missing",
    })
  } */

  // Mongoose si occupa della validazione, non più necessario

  /* else if (
    people.map((person) => person.name).find((name) => name === body.name)
  ) {
    return response.status(400).json({
      error: "utente già esistente",
    })
  } */

  // elseif non esiste in JS, ma qui if è innestato in else, essendo solo una riga non servono {}

  // non è stato implementato altro modo di controllare che richiesta al backend non cerchi di creare utente già esistente!

  const person = new Person({
    name: body.name,
    number: body.number,
    // id: generateId(),
  })

  // people = people.concat(person)
  // response.json(person)

  // if we try to store an object in the database that breaks one of the constraints, the operation will throw an exception. Servono next() e catch()

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson) // savedPerson formattata secondo metodo toJSON definito
    })
    .catch((error) => next(error))
})

app.put("/api/people/:id", (request, response, next) => {
  const { name, number } = request.body

  Person.findById(request.params.id)
    .then((person) => {
      if (!person) {
        return response.status(404).end()
      }

      person.name = name
      person.number = number

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson)
      }) // nested promises: within outer .then method, another promise chain is defined. Not recommended because it can make the code difficult to read. In this case the solution works because it ensures that the .then block following the save() method is only executed if a note with the given id is found in database and save() method is called. async/await syntax offers an easier way to handle such situations

      // Mongoose provides the method findByIdAndUpdate to find a document by its id and update it with a single method call. However, this approach does not fully suit our needs, later we'll define requirements for the data stored in the database and findByIdAndUpdate does not fully support Mongoose's validations. Mongoose's documentation also notes that save() is generally the correct choice for updating a document, as it provides full validation

      // https://masteringjs.io/tutorials/mongoose/promise
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" }) // response.send() and response.json() methods are identical when an object or array is passed, but response.json() will convert non-objects, such as null and undefined, which aren't valid JSON
}

app.use(unknownEndpoint) // middleware used before routes when we want them to be executed by the route event handlers. We want to use middleware functions after routes when middleware are only called if no route handler processes the HTTP request. This middleware will be used for catching requests made to non-existent routes and will return an error in JSON

// middleware possono terminare ciclo inviando risposta (es. res.send(), res.json(), res.redirect()). Se non invii risposta, serve next() altrimenti richiesta rimarrà bloccata in attesa (spinning infinito). next() passa al prossimo middleware/route, Express delega l'elaborazione della richiesta alla funzione successiva nello stack definito. Non succede di default: Express esegue middleware in modo sequenziale nell'ordine in cui li dichiari con app.use(). Se ometti next() e non chiudi connessione con client, Express non passerà mai al livello successivo

// Express error handlers are middleware defined with a function that accepts four parameters

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  }

  next(error) // middleware passes error to default Express error handler
}

// this has to be the last loaded middleware, also all the routes should be registered before this!

app.use(errorHandler)

const PORT = process.env.PORT || 3001 // necessario per deploy su Render
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
