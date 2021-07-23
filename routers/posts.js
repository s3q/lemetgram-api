const router = require("express").Router()
const User = require("../models/User")
const Post = require("../models/Post")
const bcrypt = require("bcrypt")
const print = require("../script")

const fs = require("fs");
const path = require("path")
const url = require("url")


const PATH_POST = `public/post`
const PATH_USER = `public/user`


//create post :
router.post("/", async (req, res) => {
    try {
        const newPost = new Post(req.body)
        const { userId } = req.body
        if (userId) {
            const user = await User.findOne({ _id: userId })
            if (user && user._id) {
                const post = await newPost.save()
                await user.updateOne({ $push: { posts: post._id } })
                res.status(200).json(post)
            } else {
                res.status(400).send("bad request")
            }
        }
    } catch (err) {
        res.status(500).json(err)
    }
})

// update post :
router.put("/:id", async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id }, { userId: 1 })
        const { userId, ...update } = req.body
        const user = await User.findOne({ _id: userId }, { posts: 1 })
        if (post && user && user.posts.includes(req.params.id) && userId === post.userId) {
            await post.updateOne({ $set: update })
            const postUpdated = await Post.findOne({ _id: req.params.id })
            res.status(200).json(postUpdated)
        } else {
            return res.status(404).send("None user or post with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})

// update post :
router.put("/:id/set_img", async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id }, { userId: 1, img: 1 })

        !req.body.img ? req.body.img = "" : null

        const { userId, img, set } = req.body
        const user = await User.findOne({ _id: userId }, { posts: 1 })
        if (post && user && user.posts.includes(req.params.id) && userId === post.userId) {
            if (set) {
                await post.updateOne({ $set: { img: img } })
            } else {
                await post.updateOne({ $set: { img: post.img + img } })
            }
            const postUpdated = await Post.findOne({ _id: req.params.id })
            res.status(200).json(postUpdated)
        } else {
            return res.status(404).send("None user or post with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})


// delete post : 
router.delete("/:id", async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id }, { userId: 1, img: 1 })
        const { userId } = req.query
        console.log(req.query)
        const user = await User.findOne({ _id: userId }, { posts: 1 })
        if (post && user && user.posts.includes(req.params.id) && userId === post.userId) {

            if (post.img && post.img != "") {

                let pathStorePost = url.parse(post.img).pathname

                if (pathStorePost.startsWith("/"))
                    pathStorePost = pathStorePost.slice(1, pathStorePost.length)

                if (fs.existsSync(pathStorePost))
                    fs.unlinkSync(pathStorePost)

            }

            await post.deleteOne()
            res.status(200).send("Post has been deleting")
        } else {
            return res.status(404).send("None user or post with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})


// like / dislike a post :
router.put("/:id/like", async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id }, { likes: 1 })
        const { userId } = req.body
        const user = await User.findOne({ _id: userId }, { posts_likes: 1 })

        if (post && user) {
            if (!post.likes.includes(userId)) {
                await post.updateOne({ $push: { likes: userId } })
                await user.updateOne({ $push: { posts_likes: req.params.id } })
                res.status(200).send("Post has been adding like")
            } else {
                await post.updateOne({ $pull: { likes: userId } })
                await user.updateOne({ $pull: { posts_likes: req.params.id } })
                res.status(200).send("Post has been removing like")
            }
        } else {
            return res.status(404).send("None user or post with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})

// get a posts :
router.get("/:id", async (req, res) => {
    try {
        // const { userId } = req.body
        // const user = await User.findOne({ _id: userId })
        const post = await Post.findOne({ _id: req.params.id })
        // if (post) {
        res.status(200).json(post)
        // } else {
        //     res.status(404).send("None post or user with this id")
        // }
    } catch (err) {
        res.status(500).json(err)
    }
})

// get all posts for user
router.get("/timeline/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { _id: 1 })
        const currentUserPosts = await Post.find({ userId: currentUser._id }, { _id: 1 })
        res.status(200).json(currentUserPosts)
    } catch (err) {
        res.status(500).json(err)
    }
})


// get all posts id for user
router.get("/timeline/user_posts_is/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { _id: 1 })
        const currentUserPosts = await Post.find({ userId: currentUser._id }, { _id: 1 })
        res.status(200).json(currentUserPosts)
    } catch (err) {
        res.status(500).json(err)
    }
})

// get all posts for my friends :
router.get("/timeline/fuser/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { followings: 1 })
        const friendsPosts = await Promise.all(
            currentUser.followings.map(friendId => {
                return Post.find({ userId: friendId })
            })
        )
        res.status(200).json(friendsPosts)
    } catch (err) {
        res.status(500).json(err)
    }
})

// get all posts id for my friends :
router.get("/timeline/fuser_posts_id/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { followings: 1 })
        const friendsPostsId = await Promise.all(
            currentUser.followings.map(friendId => {
                return Post.find({ userId: friendId }, { _id: 1 })
            })
        )
        res.status(200).json(friendsPostsId)
    } catch (err) {
        res.status(500).json(err)
    }
})


// get timeline posts :
router.get("/timeline/all/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { followings: 1, _id: 1 })
        const currentUserPosts = await Post.find({ userId: currentUser._id })
        const friendsPosts = await Promise.all(
            currentUser.followings.map(friendId => {
                return Post.find({ userId: friendId })
            })
        )
        res.status(200).json(currentUserPosts.concat(...friendsPosts))
    } catch (err) {
        res.status(500).json(err)
    }
})


// get timeline posts :
router.get("/timeline/all_posts_id/:userId", async (req, res) => {
    try {
        const { userId } = req.params
        const currentUser = await User.findOne({ _id: userId }, { followings: 1, _id: 1 })
        const currentUserPostsId = await Post.find({ userId: currentUser._id }, { _id: 1 })
        const friendsPostsId = await Promise.all(
            currentUser.followings.map(friendId => {
                return Post.find({ userId: friendId }, { _id: 1 })
            })
        )
        res.status(200).json(currentUserPostsId.concat(...friendsPostsId))
    } catch (err) {
        res.status(500).json(err)
    }
})

module.exports = router
