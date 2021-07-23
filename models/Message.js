const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        require: true,
    },
    senderId: {
        type: String,
        require: true
    },
    text: {
        type: String,
        require: true,
        min: 1,
        max: 200
    }
}, { timestamps: true })

module.exports = mongoose.model("Message", messageSchema)