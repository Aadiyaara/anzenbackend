const mongoose = require('mongoose')
const Schema = mongoose.Schema

const sosSchema = new Schema({
    kind: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    contact: {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
        required: true
    },
    dateCreated: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('SOS', sosSchema)