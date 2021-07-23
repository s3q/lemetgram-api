const path = require("path")
const https = require("https");
const fs = require("fs")

const express = require("express");
const print = require("./script");
const app = express();
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoose = require("mongoose")
const morgan = require('morgan');
const useragent = require('express-useragent');
const cors = require('cors');

const usersRouter = require("./routers/users")
const authRouter = require("./routers/auth")
const postsRouter = require("./routers/posts")
const uploadRouter = require("./routers/upload")
const conversationRouter = require("./routers/conversation")
const messageRouter = require("./routers/message")


const port = process.env.PORT || 8800

dotenv.config()


// ############ -- ############ 
// conect to mongodb  
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err) print("[!] - haven't connected to MongoDB")
    else print("[+] - have conncted successfully ")
})

// const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'Connection Error:'));
// db.once('open', () => {

//     app.listen("8800", () => {
//         print("[+] - server : listen port --> 8800")
//     })

//     const userCollection = db.collection('users');
//     const changeStreamUser = userCollection.watch();

//     changeStreamUser.on('change', (change) => {
//         console.log(change)
//     });

//     const postCollection = db.collection('posts');
//     const changeStreamPost = postCollection.watch();

//     changeStreamPost.on('change', (change) => {
//         console.log(change)
//     });
// });
// ############ -- ############ 


print(express.json())

// app.use(cors({
//     origin: "https://lemetgram-app.herokuapp.com"
// }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb' }));
app.use(helmet())
app.use(morgan("common"))
app.use(useragent.express());

app.use("/public", express.static(path.join(__dirname, "public")))

app.use("/api/users", usersRouter)
app.use("/api/auth", authRouter)
app.use("/api/posts", postsRouter)
app.use("/api/upload", uploadRouter)
app.use("/api/conversation", conversationRouter)
app.use("/api/message", messageRouter)

// const sslServer = https.createServer({
//     key: fs.readFileSync(path.join(__dirname, "../cert", "key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "../cert", "cert.pem"))
// }, app)


app.listen(port, () => {
    print("[+] - server : listen port --> "+port)
})


