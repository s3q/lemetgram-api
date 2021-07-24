const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        min: 3,
        max: 16,
        required: true,
        unique: true
    },
    name: {
        type: String, 
        min: 3,
        max: 20,
        required: true,
        unique: true
    },
    email: {
        type: String,
        max: 50,
        required: true,
        unique: true
    },
    password: {
        type: String,
        min: 6,
        required: true,
    },
    profileImg: {
        type: String,
        default: ""
    },
    coverImg: {
        type: String, 
        default: ""
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    desc: {
        type: String,
        max: 50
    },
    posts: {
        type: Array,
        default: []
    },
    city: {
        type: String,
        max: 50
    },
    from: {
        type: String,
        max: 50 
    },
    relationship: {
        type: Number,
        enum: [1, 2, 3]
    },
    posts_likes: {
        type: Array,
        default: []
    } 
}, { timestamps: true })

module.exports = mongoose.model("User", userSchema)