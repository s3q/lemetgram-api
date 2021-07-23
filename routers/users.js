const router = require("express").Router()

const User = require("../models/User")

const bcrypt = require("bcrypt")
const print = require("../script")

const API = `http://localhost:8800/api`

const fs = require("fs");
const path = require("path")
const url = require("url")
const rimraf = require("rimraf");
const axios = require("axios")


const PATH_POST = `public/post`
const PATH_USER = `public/user`
// const useragent = require('express-useragent');



// update user :
router.put("/:id", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })
        if ((user && req.body.userId === req.params.id) || (user && user.isAdmin)) {
            if (req.body.password) {
                try {
                    const salt = await bcrypt.genSalt(10)
                    req.body.password = await bcrypt.hash(req.body.password, salt)

                } catch (err) {
                    return res.status(500).json(err)
                }
            }
            const { _id, __v, isAdmin, createdAt, ...updateData } = req.body
            await user.updateOne({ $set: updateData })
            const userUpdated = await User.findOne({ _id: req.params.id })
            res.status(200).json(userUpdated)

        } else {
            return res.status(404).send("None user with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})

// update user :
router.put("/:id/set_img", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id })

        !req.body.coverImg ? req.body.coverImg = "" : null
        !req.body.profileImg ? req.body.profileImg = "" : null

        const { profileImg, coverImg, set } = req.body
        if ((user && req.body.userId === req.params.id) || (user && user.isAdmin)) {
            if (set) {
                await user.updateOne({ $set: { profileImg: profileImg, coverImg: coverImg } })
            } else {
                await user.updateOne({ $set: { profileImg: user.profileImg + profileImg, coverImg: user.coverImg + coverImg } })
            }

            const userUpdated = await User.findOne({ _id: req.params.id })
            res.status(200).json(userUpdated)

        } else {
            return res.status(404).send("None user with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})

// delete user :
router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }, { isAdmin: 1, coverImg: 1, profileImg: 1, posts: 1 })
        const { userId } = req.query
        console.log(userId, user, userId === req.params.id)
        console.log((user && userId === req.params.id) || (user && user.isAdmin))

        if ((user && userId === req.params.id) || (user && user.isAdmin)) {

            let userImgs = [user.coverImg, user.profileImg]

            userImgs.forEach(img => {
                console.log(img)
                if (img && img != "") {
                    let pathStoreUserImg = url.parse(img).pathname

                    if (pathStoreUserImg.startsWith("/"))
                        pathStoreUserImg = pathStoreUserImg.slice(1, pathStoreUserImg.length)

                    // console.log(pathStoreUserImg)
                    // if (fs.existsSync(pathStoreUserImg))
                    //     fs.unlinkSync(pathStoreUserImg)

                    let pathStoreUser = PATH_USER + "/" + pathStoreUserImg.split("/")[pathStoreUserImg.split("/").length - 2]
                    console.log(pathStoreUser)

                    if (fs.existsSync(pathStoreUser))
                        rimraf(pathStoreUser, () => console.log("folder has been deleted successfully"))

                }
            })

            console.log(user.posts)

            user.posts.forEach(async p => {
                let pathUserPost = url.parse(p.img).pathname

                if (pathUserPost.startsWith("/"))
                    pathUserPost = pathUserPost.slice(1, pathUserPost.length)

                pathUserPost = PATH_POST + "/" + pathUserPost.split("/")[pathUserPost.split("/").length - 2]

                if (fs.existsSync(pathUserPost))
                    rimraf(pathUserPost, () => console.log("folder has been deleted successfully"))

                await axios.delete(`${API}/posts/${p._id}`, { params: { userId: userId } })
            })

            await user.deleteOne()
            res.status(200).send("Account has been deleted")
        } else {
            return res.status(404).send("None user with this id")
        }
    } catch (err) {
        return res.status(500).json(err)
    }
})

// get a user :
router.get("/:id_user/:type", async (req, res) => {

    if (req.params.id_user) {
        try {

            let user = {}
            if (req.params.type == "username" || req.params.type == "user") user = await User.findOne({ username: req.params.id_user })
            else if (req.params.type == "userId" || req.params.type == "id") user = await User.findOne({ _id: req.params.id_user })

            const { password, updatedAt, ...others } = user._doc
            res.status(200).json(others)
        } catch (err) {
            return res.status(500).json(err)
        }
    } else {
        return res.status(404).send("None user with this id")
    }
})

// follow user :
router.put("/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
        try {
            const currentUser = await User.findOne({ _id: req.body.userId })
            const user = await User.findOne({ _id: req.params.id })
            if (!currentUser.followings.includes(req.params.id)) {
                await currentUser.updateOne({ $push: { followings: req.params.id } })
                await user.updateOne({ $push: { followers: req.body.userId } })
                res.status(200).send("User has been following")
            } else {
                res.status(403).send("You are already follow this user")
            }
        } catch (err) {
            return res.status(500).json(err)
        }
    } else {
        return res.status(404).send("You can't follow yourself")
    }
})

// unfollow user :
router.put("/:id/unfollow", async (req, res) => {
    if (req.params.id !== req.body.userId) {
        try {
            const currentUser = await User.findOne({ _id: req.body.userId })
            const user = await User.findOne({ _id: req.params.id })
            if (currentUser.followings.includes(req.params.id)) {
                await currentUser.updateOne({ $pull: { followings: req.params.id } })
                await user.updateOne({ $pull: { followers: req.body.userId } })
                res.status(200).send("User has been unfollowing")
            } else {
                res.status(403).send("You havn't followed this user")
            }
        } catch (err) {
            return res.status(500).json(err)
        }
    } else {
        return res.status(404).send("you cant follow yourself")
    }
})

// get all users :
router.get("/get_all_users", async (req, res) => {
    try {
        const users = await User.find({})
        let usersInfo = []
        users.forEach(user => {
            const { password, updatedAt, ...others } = user._doc
            usersInfo.push(others)
        })
        res.status(200).json(usersInfo)

    } catch (err) {
        return res.status(500).json(err)
    }
})


module.exports = router
