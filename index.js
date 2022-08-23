const dotenv = require('./dotenvConfig')()
const ejs = require('ejs')
const serviceAccount = require('./serviceAccountKey.js')
const path = require('path');
const express = require('express')
const Cors = require('cors')

const admin = require("firebase-admin")
const { getAuth, applyActionCode, } = require("firebase-admin/auth")
const sendVerificationEmail = require('./sendEmail')

// initialize Firebase Admin SDK
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const corsOption = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://firebase-auth-and-crud.vercel.app/',
  ],
  credentials: true,
  methods: 'POST',
  optionsSuccessStatus: 200
}

const PORT = process.env.PORT || 8000

const app = express()

app.use(Cors(corsOption));
app.use(express.json())

// routes
app.get('/', (req, res) => {
  res.status(200).send('Welcome to my API')
})

app.post('/send-custom-verification-email', async (req, res) => {
  const { userEmail, redirectUrl } = req.body
  //regex for email
  const emailValidate = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

  if (!userEmail?.match(emailValidate)) {
    return res.status(401).json({ message: 'Invalid email' })
  } else if (!redirectUrl || typeof redirectUrl !== 'string') {
    return res.status(401).json({ message: 'Invalid redirectUrl' })
  }

  const actionCodeSettings = {
    url: redirectUrl
  }

  const actionLink = await getAuth().generateEmailVerificationLink(userEmail, actionCodeSettings)

  applyActionCode(auth, actionCode)
    .then(async (resp) => {
      const { email } = resp.user
      const ejspath = path.join(process.cwd(), '/views/verify-email.ejs')
      const template = await ejs.renderFile(
        ejspath,
        {
          actionLink,
          randomNumber: Math.random()
        })
      await sendVerificationEmail(userEmail, template, actionLink)
      res.status(200).json({ message: 'Email successfully sent' })

    })
    .catch((err) => {
      console.log("Could not verify user: ", err.userInfo)
      const message = error.message
      console.log(message);
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ message })
      }
      if (error.code === 'auth/invalid-continue-uri') {
        return res.status(401).json({ message })
      }
      res.status(500).json({ message })
    })
}
);


// listener
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`)
})