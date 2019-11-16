const mongoose = require('mongoose')
const Schema = mongoose.Schema

const contactSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    validFor: {
        type: String,
        required: true
    },
    assistEmail: {
        type: String,
        required: true  
    },
    assistMobile: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    },
    dateCreated: {
        type: String,
        required: true
    },
    SOSs: [
        {
            type: Schema.Types.ObjectId,
            ref: 'SOS'
        }
    ],
    status: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Contact', contactSchema)