const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const salt = 10;
require('dotenv').config();

const secretKey = process.env.SECRET_JWT_KEY;

const verifyToken = (req, res, next) => {


    console.log('verify token');

    console.log(req.headers);


    const token =
        req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res
            .status(401)
            .json({ message: 'Access denied. Token is missing.' });
    }

    try {
        const decodedToken = jwt.verify(token, secretKey);
        const { name, password } = decodedToken;
        req.user = { name, password };
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Access denied. Invalid token.' });
    }
};

mongoose.connect(process.env.CONNECTIONSTRING);
mongoose.set('debug', true);

mongoose.model('User', mongoose.Schema({ name: String }));
const db = mongoose.connection.useDb(`node_course_db`, {
    // `useCache` tells Mongoose to cache connections by database name, so
    // `mongoose.connection.useDb('foo', { useCache: true })` returns the
    // same reference each time.
    useCache: true
});

// Need to register models every time a new connection is created
if (!db.models['User']) {
    db.model('User', mongoose.Schema({
        name: String,
        email: String,
        password: String,
        token: String
    }));
}

const app = express();
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get('/users', function (req, res) {

    let token = req.cookies.auth;
    console.log('Find users from', db.name);
    db.model('User').find().
        then(users => res.json({ users })).
        catch(err => res.status(500).json({ message: err.message }));
});

app.post('/add_user', verifyToken, function (req, res) {

    console.log('Add user');
    console.log(req.body.name);
    var name = req.body.name;
    var password = req.body.password;


    db.model('User').create({
        'name': name,
        'password': password
    }).then((data) => {
        console.log('User Created');
        res.json(data);

    })
        .catch(err => res.status(500).json({ message: err.message }));
});

app.post('/update_user', verifyToken, function (req, res) {

    console.log('Find users from', db.name);
    var name = req.body.name;
    var password = req.body.password;

    db.model('User').updateOne({
        'password': password
    }, {
            'name': name
        }).then((data) => {
            console.log('User Updated');
            res.json(data);

        })
        .catch(err => res.status(500).json({ message: err.message }));
});

app.post('/delete_user', verifyToken, function (req, res) {


    console.log('Find users from', db.name);
    var name = req.body.name;

    db.model('User').deleteOne({
        'name': name,
    }).then((data) => {
        console.log('User Deleted');
        res.json(data);

    }).catch(err => res.status(500).json({ message: err.message }));
});

app.post('/login_user', function (req, res) {


    console.log('Find users from', db.name);

    var name = req.body.name;
    var password = req.body.password;

    db.model('User').findOne({
        'name': name,
        'password': password
    }).then((data) => {
        console.log('User Found.');

        const token = jwt.sign({ name: name, password: password }, secretKey, { expiresIn: '1h' });
        res.json({
            'token': token,
            'name': name,
            'password': password
        });

    }).catch(err => res.status(500).json({ message: err.message }));
});

port = 3000;

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
})

