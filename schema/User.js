const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    tokenizedPassword: {
        type: String,
        required: true
    },
    lastLocation: {
        type: String
    },
    paths: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Path'
        }
    ],
    SOSs: [
        {
            type: Schema.Types.ObjectId,
            ref: 'SOS'
        }
    ],
    pool: {
        type: Schema.Types.ObjectId,
        ref: 'Pool'
    },
    address: {
        type: String,
        required: true
    }, 
    dateLastLogin: {
        type: String
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

module.exports = mongoose.model('User', userSchema)