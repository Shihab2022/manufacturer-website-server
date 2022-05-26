const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();
let port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hfg16.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("allegro-server").collection("product");
    const reviewCollection = client.db("allegro-server").collection("review");
    const orderCollection = client.db("allegro-server").collection("order");
    const userCollection = client.db("allegro-server").collection("user");
    const paymentCollection = client.db("allegro-server").collection("payment");

    //verify admin 
    const verifyAdmin=async(req,res,next)=>{
      const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({
            email: requester,
          });
          if (requesterAccount.role === "admin") {
            next()
          }
          else{
            res.status(403).send({message : 'forbidden access . '})
          }
    }

    //payment intern

app.post('/create-payment-intent',async(req,res)=>{
  const service =req.body

  const price =service.cost
    // console.log(service,price)
  const amount=price*100
  const paymentIntent = await stripe.paymentIntents.create({
    amount : amount,
    currency: 'usd',
    payment_method_types:['card']
  });
  res.send({clientSecret: paymentIntent?.client_secret})

})

    // login user and generate token

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
      res.send({ result, accessToken: token });
    });
    app.get("/users", verifyJWT, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
    app.put("/user/admin/:id",verifyJWT ,verifyAdmin,async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.get('/admin/:email',async(req,res)=>{
      const email=req.params.email;
      const user =await userCollection.findOne({email:email});
      const isAdmin=user?.role==='admin';
      res.send({admin : isAdmin})
    })
    app.post("/updateUser/:email", async (req, res) => {
      const email = req.params.email;
      const userInfo = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: userInfo,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
      // res.send(email,userInfo)
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const cursor = await userCollection.find(filter).toArray();
      // console.log(email)
      res.send(cursor);
    });

    app.get("/tools", async (req, res) => {
      const tools = await toolsCollection.find({}).toArray();
      res.send(tools);
    });
    app.post("/tools",verifyJWT, verifyAdmin, async (req, res) => {
      const addedProduct = req.body;
      const result = await toolsCollection.insertOne(addedProduct);
      res.send(result);
    });
    app.get("/tools/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await toolsCollection.findOne(filter);
      res.send(result);
    });
    app.delete("/tools/:id",verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const cursor = await toolsCollection.deleteOne(filter);
      res.send(cursor);
    });
    app.get("/review", async (req, res) => {
      const review = await reviewCollection.find({}).toArray();
      res.send(review);
    });
    app.post("/review",verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.get("/order", async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });
    app.post("/order", async (req, res) => {
      const userOrder = req.body;
      const result = await orderCollection.insertOne(userOrder);
      res.send(result);
    });
    app.patch('/order/:id',async(req,res)=>{
      const id=req.params.id
      const payment =req.body
      const filter ={_id :ObjectId(id)}
      const updatedDoc={
        $set:{
          paid:true,
          status:'pending',
          transactionId : payment.transactionId
        }
        
      }
      const result =await paymentCollection.insertOne(payment)
      const updateOrder=await orderCollection.updateOne(filter,updatedDoc)
      res.send(updateOrder)
      console.log(id,payment)
    })
    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      // const query = {email :email };
      const filter = { email: email };
      const cursor = await orderCollection.find(filter).toArray();
      // console.log(email)
      res.send(cursor);
    });
    app.get("/paymentOrder/:id",verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const cursor = await orderCollection.findOne(filter);
      // console.log(id,filter)
      res.send(cursor);
    });
    app.delete("/order/:id",verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const cursor = await orderCollection.deleteOne(filter);
      // console.log(id,filter)
      res.send(cursor);
    });


    // end
  } 
  
  finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("allegro server in running");
});
app.listen(port, () => {
  console.log("allegro server  running on port", port);
});
