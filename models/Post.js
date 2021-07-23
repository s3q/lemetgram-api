const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: String,
        require: true
    },
    title: {
        type: String,
        max: 20
    },
    desc: {
        type: String,
        max: 500
    },
    img: {
        type: String,
        default: "",
        require: true
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    }

}, { timestamps: true })

module.exports = mongoose.model("Post", postSchema)