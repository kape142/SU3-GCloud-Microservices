const express = require('express');
var bodyParser = require("body-parser");
const fetch = require('node-fetch');

// Imports the Google Cloud client library
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore();

const app = express();
app.use(bodyParser.json()); // for parsing application/json


function initialSetup(){
    let list = [

        {"navn":"Mais", "produktID":1, "pris":6},
        {"navn":"Ketchup", "produktID":2, "pris":25},
        {"navn":"Sjokolade", "produktID":3, "pris":40},
        {"navn":"Coca Cola", "produktID":4, "pris":30},
        {"navn":"Salt", "produktID":5, "pris":15},
        {"navn":"Pepperkaker", "produktID":6, "pris":45},
        {"navn":"Chips", "produktID":7, "pris":20},
        {"navn":"Hamburger", "produktID":8, "pris":50},
        {"navn":"Kyllingvinger", "produktID":9, "pris":60},
        {"navn":"Banan","produktID":10,"pris":8},
        {"navn":"Djevelen", "produktID":666, "pris":666}
    ];
    for(let i = 0; i < list.length; i++){
        let item = list[i];
        const newMessage = {
            key: datastore.key(["products",item.produktID]),
            data: item
        };

        datastore
            .upsert(newMessage)
            .then(
                json => {
                    console.log(json);
                })
            .catch(error => {
                console.warn("Error: " + error);
            });
    }
}

app.get('/products', (req, res) => {
    //console.error('Getting all messages');
    const query = datastore.createQuery('products');

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => res.send(list))
        .catch(err => {
            res.status(500).send("Could not retrieve all products");
            console.error('Getting all products: ', err)
        });
});


app.get('/products/:productid', (req, res) => {
    let id = req.params.productid;
    let key = datastore.key(["products",Number(id)]);
    const query = datastore.createQuery("products")
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length>0){
                res.send(list[0])
            }else{
                res.status(404).send('no product with that id')
            }
        })
        .catch(err => console.error('Getting product #'+req.params.productid+': ', err));
});

setTimeout(initialSetup, 5000);

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Node server listening on port ${port}`);
});
