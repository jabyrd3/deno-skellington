import Server from './server.mjs'
const app = new Server({
  port: 8080
})
app.get('/hello', (req, res) => {
  return res.status(200)
    .send('howdy 🤠')
})
app.post('/posttest', (req, res) => {
  return res.status(200).send(req.data)
})
app.start()
