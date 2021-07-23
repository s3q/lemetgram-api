const router = require("express").Router()
const print = require("../script")
const bcrypt = require("bcrypt")
const { v4 } = require("uuid");

const User = require("../models/User")
const Login = require("../models/Login")


function getImp(obj) {
    const { _id, __v, updatedAt, createdAt, ...others } = obj
    return others
}

// Register :
router.post("/register", async (req, res) => {
    // generate a hash password :
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    req.body["password"] = hashedPassword
    // create new user : 
    const newUser = new User(req.body)

    // save user and return response :
    try {
        const user = await newUser.save()
        const { password, __v, updatedAt, ...others } = user._doc
        res.status(200).json(others)
    } catch (err) {
        print(err)
        res.status(500).json(err)
    }
})


router.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user && !user._id) res.status(404).send("user not found")

        const validPassword = await bcrypt.compare(req.body.password, user.password)
        if (!validPassword) res.status(400).send("worng password")

        const { password, __v, updatedAt, ...others } = user._doc
        res.status(200).json(others)
    } catch (err) {
        print(err)
        res.status(500).json(err)
    }

})


router.post("/save_login", async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email: email })
        if (!user && !user._id) res.status(404).send("user not found")

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) res.status(400).send("worng password")




        const createLogin = async () => {

            const salt = await bcrypt.genSalt(10)

            const impUser = getImp(user._doc)
            delete impUser.password

            console.log(impUser)
            let loginPassword = await bcrypt.hash(user._id + user.createdAt, salt)

            let loginData = {
                user_agent: req.get('user-agent'),
                user_id: user._id,
                login_time: new Date().getTime(),
                login_id: v4(),
                login_password: loginPassword
            }

            loginData = { ...loginData, ...impUser }
            console.log(loginData)
            const newLogin = new Login(loginData)

            // save user and return response :
            const login = await newLogin.save()

            const impLogin = getImp(login._doc)
            delete impLogin.login_password

            console.log(impLogin)

            res.status(200).json(impLogin)
        }



        const loginCheck = await Login.findOne({ user_id: user._id })

        if (loginCheck && loginCheck._id) {

            let loginPassword = user._id + user.createdAt

            const validPassword = await bcrypt.compare(loginPassword, loginCheck.login_password)
            console.log(validPassword)
            if (!validPassword) res.status(400).send("worng password")

            let loginTimeHours = (Date.now() - loginCheck.login_time) / 3600000






            if (loginTimeHours > 44) {

                await loginCheck.deleteOne()
                createLogin()

            } else {


                const impUser = getImp(user._doc)
                delete impUser.password

                let loginData = {
                    user_agent: req.get('user-agent'),
                    login_time: new Date().getTime(),
                    login_id: v4(),
                }

                loginData = { ...loginData, ...impUser }

                await loginCheck.updateOne(loginData)

                const loginUpdate = await Login.findOne({ _id: loginCheck._id })

                const impLogin = getImp(loginUpdate._doc)
                delete impLogin.login_password

                console.log(impLogin)

                res.status(200).json(impLogin)

            }


        } else {

            createLogin()

        }
    } catch (err) {
        print(err)
        res.status(500).json(err)
    }

})



router.put("/update_login", async (req, res) => {
    try {
        const { loginId, userId } = req.body
        const user_agent = req.get("user-agent")

        const user = await User.findOne({ _id: userId })
        if (!user && !user._id) res.status(404).send("user not found")

        const login = await Login.findOne({ login_id: loginId })

        if (login && login._id && user_agent == login.user_agent) {

            let loginPassword = user._id + user.createdAt

            const validPassword = await bcrypt.compare(loginPassword, login.login_password)
            console.log(validPassword)
            if (!validPassword) res.status(400).send("worng password")

            const impUser = getImp(user._doc)
            delete impUser.password

            await login.updateOne(impUser)

            const loginUpdate = await Login.findOne({ _id: login._id })

            const impLogin = getImp(loginUpdate._doc)
            delete impLogin.login_password

            console.log(impLogin)

            res.status(200).json(impLogin)
        }

    } catch (err) {
        print(err)
        res.status(500).json(err)
    }

})



router.delete("/delete_login", async (req, res) => {
    //
    try {
        const { loginId, userId } = req.query

        const user = await User.findOne({ _id: userId }, { _id: 1, createdAt: 1 })
        if (!user && !user._id) res.status(404).send("user not found")

        const user_agent = req.get('user-agent')

        if (user && user._id) {

            const login = await Login.findOne({ login_id: loginId })
            if (!login && !login._id) res.status(404).send("login not found")

            if (user_agent == login.user_agent) {

                let loginPassword = user._id + user.createdAt

                const validPassword = await bcrypt.compare(loginPassword, login.login_password)
                console.log(validPassword)
                if (!validPassword) res.status(400).send("worng password")

                await login.deleteOne()
                res.status(200).json("Login has deleted successfully")

            } else {
                res.status(400).json("The login data is invalid")
            }
        }
    } catch (err) {
        print(err)
        res.status(500).json(err)
    }

})

router.post("/auto_login", async (req, res) => {
    //
    try {
        const { loginId, userId } = req.body

        const user = await User.findOne({ _id: userId }, { _id: 1, createdAt: 1 })
        if (!user && !user._id) res.status(404).send("user not found")

        const user_agent = req.get('user-agent')

        if (user && user._id) {

            const login = await Login.findOne({ login_id: loginId })
            if (!login) res.status(404).send("login not found")

        
            if (user_agent == login.user_agent) {

                let loginPassword = user._id + user.createdAt

                const validPassword = await bcrypt.compare(loginPassword, login.login_password)
                if (!validPassword) res.status(400).send("worng password")

                let loginTimeHours = (Date.now() - login.login_time) / 3600000

                if (loginTimeHours > 44) {

                    login.deleteOne()
                    res.status(404).json("The login data is invalid")

                } else {

                    const impLogin = getImp(login._doc)
                    delete impLogin.login_password

                    res.status(200).json(impLogin)

                }
            } else {
                res.status(404).json("The login data is invalid")
            }
        }
    } catch (err) {
        print(err)
        res.status(500).json(err)
    }

})


module.exports = router
