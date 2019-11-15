const mongoose = require('mongoose')
const Schema = mongoose.Schema

const blogSchema = new Schema({
    kind: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [
        {
            type: String
        }
    ],
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    highlights: [
        {
            type: String
        }
    ],
    dateCreated: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Blog', blogSchema)