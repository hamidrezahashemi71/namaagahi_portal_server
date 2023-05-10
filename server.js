require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const cors = require('cors')
const corsOptions = require('./config/corsOptions')
const { logger } = require('./middleware/logEvents')
const errorHandler  = require('./middleware/errorHandler')
const verifyJWT = require('./middleware/virifyJWT')
const credentials = require('./middleware/credentials')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const connectDB = require('./config/dbConnect')
const PORT = process.env.PORT || 3500

// connect to MongoDB
connectDB()

// custom logger middleware
app.use(logger)

// handle options credentials check before CORS and fetch cookies credentials requirement
app.use(credentials)

// using cors options for managing request and sharing the server
app.use((cors(corsOptions)))

// built-in middleware to handle urlencoded data (form data)
app.use(express.urlencoded({ extended: false }))

// built-in middleware to handle json
app.use(express.json())

// middleware for cookies 
app.use(cookieParser())

// serve static files
app.use('/', express.static(path.join(__dirname, '/public')))

// routes
app.use('/', require('./routes/root'))
app.use('/register', require('./routes/api/register'))
app.use('/auth', require('./routes/api/auth'))
app.use('/refresh', require('./routes/api/refresh'))
app.use('/logout', require('./routes/api/logout'))
app.use(verifyJWT)
app.use('/employees', require('./routes/api/employees'))
app.use('/users', require('./routes/api/users'))

// Custom 404 page
app.all('*', (req, res) => {
    res.status(404)
    if(req.accepts('html')) res.sendFile(path.join(__dirname, 'views', '404.html'))
    else if(req.accepts('json')) res.json({error: "404 Not Found!"})
    else res.type('txt').send("404 Not Found!")
})

// Custom Error handling
app.use(errorHandler)

mongoose.connection.once('connected', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})