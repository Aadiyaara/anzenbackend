const mongoose = require('mongoose')
const Schema = mongoose.Schema

const poolSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    num: {
        type: Number,
        required: true
    },
    paths: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Path'
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

module.exports = mongoose.model('Pool', poolSchema)