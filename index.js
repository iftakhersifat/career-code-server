const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER)
console.log(process.env.DB_PASSWORD)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mojyanw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // job api
    const jobsCollection = client.db("careerCode").collection("jobs");
    const applicationsCollection = client.db("careerCode").collection("applications");
    
    // get data
    app.get("/jobs", async(req, res)=>{
        const result =await jobsCollection.find().toArray()
        res.send(result)
    })
    // single id
    app.get("/jobs/:id", async(req, res)=>{
    const id= req.params.id;
    const query = {_id: new ObjectId(id)}
    const resultShow = await jobsCollection.findOne(query)
    res.send(resultShow)
    })

    // job application related apis
    app.post('/applications', async (req, res) => {
    const newJob = req.body;
    const result = await applicationsCollection.insertOne(newJob)
    res.send(result)
    });

    // get applications
    app.get("/applications", async(req, res)=>{
      const email = req.query.email
      const query={
        applicant : email
      }
      const result=await  applicationsCollection.find(query).toArray()
      res.send(result)

    })








    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('career-code-server');
});


app.listen(port, () => {
  console.log(`career-code-server is running on port ${port}`);
});
