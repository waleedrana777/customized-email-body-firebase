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
const auth = adminApp.auth();

const corsOption = {
  origin: '*',
  optionsSuccessStatus: 200,
  credentials: true,
  // methods: 'GET, POST, PUT, DELETE, OPTIONS',
  // allowedHeaders: 'Content-Type, Authorization, Content-Length, X-Requested-With'
}

const PORT = process.env.PORT || 8000

const app = express()

app.use(Cors(corsOption));
app.use(express.json());

//set up cors using this method, prefered over cors package
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


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

  //generate custom email verification link
  var actionLink = await getAuth().generateEmailVerificationLink(userEmail, actionCodeSettings)

  // appending email of the user to the link
  actionLink = actionLink + `&email=${userEmail}`;

  //path to the template
  const tempPath = path.join(process.cwd(), 'views/verify-email.ejs')

  //rendering the email to be sent
  const template = await ejs.renderFile(
    tempPath,
    {
      actionLink,
      randomNumber: Math.random()
    });
  await sendVerificationEmail(userEmail, template, actionLink)
  res.status(200).json({ message: 'Email successfully sent' });

});

// listener
app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}`)
})

module.exports = app;