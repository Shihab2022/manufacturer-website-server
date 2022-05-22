const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
let port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hfg16.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  console.log('mongodb is connected')
  client.close();
});


app.get('/',async(req,res)=>{
    res.send('allegro server in running')
})
app.listen(port, () => {
    console.log("allegro server  running on port", port);
  });