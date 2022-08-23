const dotenv = require('./dotenvConfig')()
console.log(process.env.PROJECT_ID);
const serviceAccount = require('./serviceAccountKey.js')

const express = require('express')
const Cors = require('cors')
const ejs = require('ejs')

const admin = require("firebase-admin")
const { getAuth } = require("firebase-admin/auth")
const sendVerificationEmail = require('./sendEmail')

// initialize Firebase Admin SDK
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const corsOption = {
  origin: '*',
  optionsSuccessStatus: 200
}

const PORT = process.env.PORT || 8000

const app = express()

app.use(Cors(corsOption))
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

  try {
    const actionLink = await getAuth()
      .generateEmailVerificationLink(userEmail, actionCodeSettings)

    const template = await ejs.renderFile(
      path = './views/verify-email.ejs',
      queries = {
        actionLink,
        randomNumber: Math.random()
      })
    await sendVerificationEmail(userEmail, template, actionLink)
    res.status(200).json({ message: 'Email successfully sent' })
  } catch (error) {
    const message = error.message
    console.log(message);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ message })
    }
    if (error.code === 'auth/invalid-continue-uri') {
      return res.status(401).json({ message })
    }
    res.status(500).json({ message })
  }
})


// listener
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`)
})