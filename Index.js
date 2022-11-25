const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decoded) {
        if (error) {
            res.status(403).send({ message: 'Forbidden Access' });
        }
        else {
            req.decoded = decoded;
            next();
        }
    })
}

async function run() {
    try {
        const categoriesCollection = client.db('bookly').collection('categories');
        const usersCollection = client.db('bookly').collection('users');
        const booksCollection = client.db('bookly').collection('books');
        const bookingsCollection = client.db('bookly').collection('bookings');

        const verifyseler = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);

            if (user?.role !== 'Seler') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

        app.get('/categories', async (req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
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
        app.get('/slers', verifyToken, async (req, res) => {
            const query = { role: "Seler" };
            const allSeler = await usersCollection.find(query).toArray();
            res.send(allSeler);
        })
        app.get('/buyers', verifyToken, async (req, res) => {
            const query = { role: "Buyer" };
            const allBuyers = await usersCollection.find(query).toArray();
            res.send(allBuyers);
        })
        app.get('/users/admin', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === "admin" });
        })
        app.get('/users/seler', async (req, res) => {
            const email = req.query.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeler: user?.role === "Seler" });
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        app.post('/books', verifyToken, verifyseler, async (req, res) => {
            const book = req.body;
            const result = await booksCollection.insertOne(book)
            res.send(result);
        })
        app.get('/books/:id', async (req, res) => {
            const categoryId = req.params.id;
            const query = { categoryId };
            const books = await booksCollection.find(query).toArray()
            res.send(books);
        })
        app.get('/mybooks', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { selerEmail: email };
            const myBooks = await booksCollection.find(query).toArray()
            res.send(myBooks);
        })
        app.post('/bookings', verifyToken, async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            const id = req.query.bookId;
            const filter = {
                _id: ObjectId(id)
            }
            const updatedDoc = {
                $set: {
                    sold: true
                }
            }
            const updateResult = await booksCollection.updateOne(filter, updatedDoc,);
            res.send(result);
        })
        app.delete('/mybooks/:id', verifyToken, verifyseler, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await booksCollection.deleteOne(query);
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