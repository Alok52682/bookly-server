const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w2hsrgs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('bookly').collection('categories');
        const usersCollection = client.db('bookly').collection('users');

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })
        app.get('/slers', async (req, res) => {
            const query = { role: "Seler" };
            const allSeler = await usersCollection.find(query).toArray();
            res.send(allSeler);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '15d' });
                res.send({ accessToken: token });
            }
            else {
                res.status(403).send({ message: 'Forbidden Access' })
            }
        })
        app.get('/buyers', async (req, res) => {
            const query = { role: "Buyer" };
            const allBuyers = await usersCollection.find(query).toArray();
            res.send(allBuyers);
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })


    }
    finally {

    }

}
run().catch(console.log)



app.get('/', (req, res) => {
    res.send('Bookly server is running!!');
});

app.listen(port, () => {
    console.log(`server is running on port : ${port}`);
})