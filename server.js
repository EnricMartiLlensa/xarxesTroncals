const fs = require('fs')
const https = require('https')
const express = require('express')
var credentials = {
      key: fs.readFileSync('./xarxes.key'),
      cert: fs.readFileSync('./xarxes.crt')
}
const morgan = require('morgan')

const app = express()

app.use(morgan())
app.use(express.static('public'))

app.get('/', (req, res) => {
      res.sendFile(__dirname + '/index.html')
})

const httpsServer = https.createServer(credentials, app)
httpsServer.listen(3000)