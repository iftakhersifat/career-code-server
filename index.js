const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const cookieParser=require("cookie-parser")
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 3000;


app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true //allow cookies
}));
app.use(express.json());
app.use(cookieParser())

const logger=(req, res, next)=>{
  console.log("logger")
  next();
}
const verifyToken=(req, res, next)=>{
  const token=req?.cookies?.token
  console.log("token", token)
  if(!token){
    return res.status(401).send({message: 'Unauthorized'})
  }
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded)=>{
    if(error){
      return res.status(401).send({message: 'Unauthorized Access'})
    }
    req.decoded=decoded
    next()
  })
  
}

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

    // jwt token related api
   app.post("/jwt", async(req, res)=>{
    const {email} =req.body
    const userInfo ={email}
    const token=jwt.sign(userInfo, process.env.JWT_SECRET, {expiresIn: '1h'})

    // set token in the cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: false
    })

    res.send({ token })
   })
    
    // get data
    app.get("/jobs", async(req, res)=>{
      const email=req.query.email
      let query={}
      if(email){
        query={hr_email: email}
      }
        const result =await jobsCollection.find(query).toArray()
        res.send(result)
    })
    // single id
    app.get("/jobs/:id", async(req, res)=>{
    const id= req.params.id;
    const query = {_id: new ObjectId(id)}
    const resultShow = await jobsCollection.findOne(query)
    res.send(resultShow)
    })
    // job post
    app.post('/jobs', async (req, res) => {
    const newJob = req.body;
    console.log('added newJob:', newJob);
    const add = await jobsCollection.insertOne(newJob)
    res.send(add)
    });

    // // find job by hr email
    // app.get('/jobsByEmail', async (req, res) => {
    // const email = req.query.email
    // const query={hr_email: email}
    // const result=await jobsCollection.find(query).toArray()
    // res.send(result)
    // });







    // job application related apis
    app.post('/applications', async (req, res) => {
    const newJob = req.body;
    const result = await applicationsCollection.insertOne(newJob)
    res.send(result)
    });

    // application by id
    app.get("/applications/:id", async(req, res)=>{
    const id= req.params.id;
    
    const query = {id: id}
    const resultShow = await applicationsCollection.find(query).toArray()
    res.send(resultShow)
    })

    // particular for patch
    
app.put("/applications/:id", async (req, res) => {
    const id = req.params.id;
    const newStatus = req.body.status;

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: newStatus
        }
    };

    const result = await applicationsCollection.updateOne(filter, updateDoc);
    res.send(result);
});






    // get applications
    app.get("/applications", logger, verifyToken, async(req, res)=>{
      const email = req.query.email

      if(email !==  req.decoded.email){
        return res.status(403).send({message: "forbidden"})
      }
      
      const query={
        applicant : email
      }
      const result=await  applicationsCollection.find(query).toArray()

      for(const application of result){
        const jobId =application.id;
        const query = {_id: new ObjectId(jobId)}
        const job =await jobsCollection.findOne(query)
        application.company =job.company
        application.title = job.title
        application.company_logo =job.company_logo
        application.location =job.location
        application.jobType =job.jobType
        application.category =job.category
      }

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
