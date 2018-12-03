const express = require('express');
var bodyParser = require("body-parser");
const fetch = require('node-fetch');

// Imports the Google Cloud client library
const Datastore = require('@google-cloud/datastore');
const datastore = new Datastore();

const app = express();
app.use(bodyParser.json()); // for parsing application/json

function initialSetup(){
    let kape = {
        products: [
            1, 3, 4
        ],
        status: "Not confirmed"
    };

    const newMessage = {
        key: datastore.key(["deliveries",1]),
        data: kape
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


app.post('/delivery/createOrder', (req, res) => {
    let products = req.body.products;
    let id = Math.floor(Math.random() * 1e9)+1;
    const newMessage = {
        key: datastore.key(["deliveries", id]),
        data: {
            products: products,
            status: "Not confirmed"
        }
    };

    datastore
        .upsert(newMessage) //kan risikere å skrive over en gammel ordre, burde sjekke om IDen er i bruk, eller lage et bedre system for velging av id
        .then(
            json => {
                console.log(json);
                res.send({id: id})
            })
        .catch(error => {
            console.warn(`Creating order failed: ${error}`);
            res.status(500).send(`Creating order failed: ${error}`);
        });
});

app.post('/delivery/deliverOrder/:orderid', (req, res) => {
    let id = req.params.orderid;
    let key = datastore.key(["deliveries", Number(id)]);
    const query = datastore.createQuery('deliveries')
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length>0 && list[0].hasOwnProperty("products")){
                let order = list[0];
                updateOrder(order, "Pending", id, res);
                setTimeout(()=>updateOrder(order, "Under delivery", id, res), 10*1000);
                setTimeout(()=>updateOrder(order, "Delivered", id, res), 20*1000);
            }else{
                res.status(404).send("no order with this id");
            }
        })
        .catch(err => {
            console.error(`Getting order status for id ${id}: ${err}`);
            res.status(500).send(`Getting order status for id ${id}: ${err}`);
        });
});

function updateOrder(order, status, id, res){
    order.status = status;
    const newMessage = {
        key: datastore.key(["deliveries", Number(id)]),
        data: order
    };

    datastore
        .upsert(newMessage)
        .then(
            json => {
                console.log(json);
                res.status(200).send("updated status: "+status);
            })
        .catch(error => {
            console.warn(`Updating status for order ${id}: ${error}`);
            res.status(500).send(`Updating status for order ${id}: ${error}`);
        });

}

app.get('/delivery/:orderid', (req, res) => {
    let orderid = req.params.orderid;
    let key = datastore.key(["deliveries",Number(orderid)]);
    const query = datastore.createQuery('deliveries')
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length>0 && list[0].hasOwnProperty("status")){
                res.send({status: list[0].status});
            }else{
                res.status(404).send("no order with this id");
            }
        })
        .catch(err => {
            console.error(`Getting order status for id ${orderid}: ${err}`);
            res.status(500).send(`Getting order status for id ${orderid}: ${err}`);
        });
});

app.get('/delivery/', (req, res) => {
    const query = datastore.createQuery('deliveries');

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => res.send(list))
        .catch(err => {
            console.error(`Getting order status for id ${orderid}: ${err}`);
            res.status(500).send(`Getting order status for id ${orderid}: ${err}`);
        });
});

setTimeout(initialSetup, 5000);

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Node server listening on port ${port}`);
});
