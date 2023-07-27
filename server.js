const express = require('express');
const jwt = require('jsonwebtoken');
const {MongoClient} = require('mongodb');
const  ObjectID = require('mongodb').ObjectId;
const cors = require('cors')
const app = express();
const url = 'mongodb://0.0.0.0:27017/';
const client = new MongoClient(url);
const database = 'E-comm';
const db = client.db(database);
const secretKey = "secretkey";
app.use(cors()); //middleware to handle cors error
app.use(express.json());

// api to login
app.post('/login',async (req,res)=>{
    //const {username,password} = req.body;
    const userData = {
        'username' : req.body.username,
        'password' : req.body.password
    }
    const result = await db.collection('user').findOne(userData);
    if(!result) return res.status(403).json("Authentication failed");
    jwt.sign({userId: result._id},secretKey,{expiresIn: '500s'},(err,token)=>{
        if (err) {
            res.status(500).json({ error: 'Failed to generate token' });
        } else {
            res.json(
                { token: token ,
                  role : result.role
                }
            );
        }
    })
})

// dummy api to check varification token
app.post('/profile',verifyToken ,(req,res)=>{
    res.json("success");
})

//function to verify authentication token
function verifyToken(req,res,next){
    const token = req.headers['x-access-token'];
    if(!token)
        return res.status(403).send("Authorization token required");
    jwt.verify(token,secretKey,(err,data)=>{
        if(err){
            res.send({
                result : "invalid token"
            })
        }else{
            next();
        }
    })
}


//api to get all items from product collection
app.get('/get-all-products',verifyToken,async (req,res)=>{
    try{
        let data = await db.collection('Products').find({}).toArray();
        res.json(data);
    }catch(e){
        console.error('Error retrieving data:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to get all items if category is specified

app.get('/get-product/:category',verifyToken,async (req,res)=>{
    try{
        const category = req.params.category; 
        let data = await db.collection('Products').find({category}).toArray();
        res.json(data);
    }catch(e){
        console.error('Error retrieving data:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get('/get-item',verifyToken,async (req,res)=>{
    try{
        const id = req.query.id; 
        const category = req.query.category;
        if(!id && !category){
            return res.status(400).json({ message: 'Either id or category is mandatory.' });
        }

        let query = {};
         if(id){
          query. _id= new ObjectID(id)
         }else if(category){
            query.category = category;
         }

        let data = await db.collection('Products').find(query).toArray();
        res.json(data);
    }catch(e){
        console.error('Error retrieving data:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// api to get product by id
app.get('/get-product-by-id/:id',verifyToken,async (req,res)=>{
    const id = req.params.id; 
    try{
        console.log('Requested ID:', id);
        let data = await db.collection('Products').find({_id : new ObjectID(id)}).toArray();
        res.json(data);
    }catch(e){
        console.error('Error retrieving data:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to update item in product collection
app.put('/update-product/:id',verifyToken,async (req,res) =>{
   const id = req.params.id;
   const updateData = req.body;
   try{
        const result = await db.collection('Products').updateOne(
            { _id : new ObjectID(id) },
            { $set : updateData },
            { upsert: false }
        );
        console.log(result);
        if(result.matchedCount>0){
            res.status(200).json({ message: 'Data updated successfully.' });
        }else{
            res.status(404).json({ message: 'Data not found.' });
        }
   }catch(e){

   } 
});

//api to post item in product collection
app.post('/post-product',verifyToken, async (req,res) =>{
    try{
        const newProduct = req.body;
        delete newProduct._id;
        console.log(newProduct);
        const result = await db.collection('Products').insertOne(newProduct);
        res.status(201).json({message :'Data added successfully'});
    }catch(e){
        console.error('Error adding data:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//api to delete item from product collection
app.delete('/delete-product/:id',verifyToken,async(req,res)=>{
    console.log(req.params);
    const id = req.params.id;
    try {
        const result= await db.collection('Products').deleteOne( { _id : new ObjectID(id) } );
        console.log(result);
        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Data deleted successfully.' });
          } else {
            res.status(404).json({ message: 'data not found.' });
          }
     } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
     }
})
  

app.listen(8000,()=>{
    console.log("Server is running on 8000 port");
})