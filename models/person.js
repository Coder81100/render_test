const mongoose = require("mongoose")

const password = process.argv[2]

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

personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  },
})

module.exports = mongoose.model("Person", personSchema)
