const mongoose = require("mongoose")

const password = process.argv[2] // iCo58E5RfAMun47B

// there are many ways to define value of an environment variable. For example, we can define it when starting the app:

// MONGODB_URI="mongodb://silviochieco_db_user:iCo58E5RfAMun47B@ac-chxztrc-shard-00-00.yomyo4h.mongodb.net:27017,ac-chxztrc-shard-00-01.yomyo4h.mongodb.net:27017,ac-chxztrc-shard-00-02.yomyo4h.mongodb.net:27017/personApp?ssl=true&replicaSet=atlas-7rci63-shard-0&authSource=admin&appName=Cluster0" npm run dev

// oppure npm install dotenv + file .env in root del progetto + aggiungere file a .gitignore o sarà pubblicato su GitHub

const url = process.env.MONGODB_URI

mongoose.set("strictQuery", false)

console.log("connecting to", url)

mongoose
  .connect(url, { family: 4 })
  .then((result) => {
    console.log("connected to MongoDB")
  })
  .catch((error) => {
    console.log("error connecting to MongoDB:", error.message)
  })

// se validatori di default di Mongoose non bastano, se ne possono definire custom. On update operations, Mongoose validators are off by default

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
  },
  number: {
    type: String,
    minLength: 8,
    required: true,
    match: [
      /^\d{2,3}-\d+$/,
      "Value must have 2-3 numbers, a hyphen, and end with numbers.",
    ],
  },
})

// il frontend si aspetta una stringa id unica. even if _id property of Mongoose objects looks like a string, it is in an object. toJSON method below transforms it into a string. Without this, it would cause more harm once we start writing tests

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

// Defining Node modules differs from the way of defining ES6 modules. The public interface of the module is defined by setting a value to the module.exports variable. We'll set the value to be the Person model. The other things defined inside of the module, like variables mongoose and url will not be accessible or visible to users of the module.

module.exports = mongoose.model("Person", personSchema)
