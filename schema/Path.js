const mongoose = require('mongoose')
const Schema = mongoose.Schema

const pathSchema = new Schema({
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
        ref: 'User'
    },
    pool: {
        type: Schema.Types.ObjectId,
        ref: 'Pool'
    },
    source: {
        type: String,
        required: true
    },
    destination: {
        type: String,
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

module.exports = mongoose.model('Path', pathSchema)