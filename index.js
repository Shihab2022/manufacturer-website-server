const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
let port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hfg16.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
      await client.connect();
      const toolsCollection = client.db("allegro-server").collection("product");


    app.get('/tools',async(req,res)=>{
        const tools=await toolsCollection.find({}).toArray()
        res.send(tools)
    })
    app.get('/tools/:id',async(req,res)=>{
        const id =req.params.id
        const filter={_id : ObjectId(id)}
        const result=await toolsCollection.findOne(filter)
        res.send(result)
    })
  
    } finally {
     
    }
  }
  run().catch(console.dir);



// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   console.log('mongodb is connected')
//   client.close();
// });


app.get('/',async(req,res)=>{
    res.send('allegro server in running')
})
app.listen(port, () => {
    console.log("allegro server  running on port", port);
  });