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
        ]
    };

    const newMessage = {
        key: datastore.key(["shoppingcarts","kape142@hotmail.com"]),
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


app.post('/shoppingcart/:email', (req, res) => {
    let email = req.params.email;
    let key = datastore.key(["shoppingcarts",email]);
    const query = datastore.createQuery("shoppingcarts")
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length==0){
                list.push({
                    products: []
                })
            }
            let obj = list[0];
            if(!obj.hasOwnProperty("products")){
                obj.products = [];
            }
            obj.products.push(req.body.productid);
            const newMessage = {
                key: datastore.key(["shoppingcarts",email]),
                data: obj
            };

            datastore
                .upsert(newMessage)
                .then(
                    json => {
                        console.log(json);
                        res.status(200).send(newMessage);
                    })
                .catch(error => {
                    console.warn(`Updating shoppingcart for user ${req.params.email}: ${error}`);
                    res.status(500).send(`Updating shoppingcart for user ${req.params.email}: ${error}`);
                });
        })
        .catch(err => {
            console.error(`Getting shoppingcart for user ${req.params.email}: ${err}`);
            res.status(500).send(`Getting shoppingcart for user ${req.params.email}: ${err}`);
        });
});

app.get('/shoppingcart/:email', (req, res) => {
    let email = req.params.email;
    let key = datastore.key(["shoppingcarts",email]);
    const query = datastore.createQuery('shoppingcarts')
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length>0 && list[0].hasOwnProperty("products")){
                res.send(list[0].products);
            }else{
                res.status(404).send("no shoppingcart for this user");
            }
        })
        .catch(err => {
            console.error(`Getting shoppingcart for user ${req.params.email}: ${err}`);
            res.status(500).send(`Getting shoppingcart for user ${req.params.email}: ${err}`);
        });
});


app.get('/shoppingcart', (req, res) => {
    const query = datastore.createQuery('shoppingcarts');

    datastore
        .runQuery(query)
        .then(entities => res.send(entities[0]))
        .catch(err => {
            console.error(`Getting all shoppingcarts: ${err}`);
            res.status(500);
        });
});

app.post('/shoppingcart/buy/:email', (req, res) =>{
    let email = req.params.email;
    let key = datastore.key(["shoppingcarts",email]);
    const query = datastore.createQuery('shoppingcarts')
        .filter('__key__','=',key);

    datastore
        .runQuery(query)
        .then(entities => entities[0])
        .then(list => {
            if(list.length>0 && list[0].hasOwnProperty("products")){
                let products = list[0].products;
                console.log(products);
                fetch(req.protocol + '://' + req.hostname + "/delivery/createOrder", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                    body:  JSON.stringify({products: products})
                })
                    .then(response => response.json())
                    .then(
                        obj => {
                            res.send(obj);
                            setTimeout(()=>{
                                fetch(req.protocol + '://' + req.hostname + "/delivery/deliverOrder/"+obj.id, {
                                    method: "POST"
                                }).catch(err=>res.status(500).send("fetch error:" + err))
                            }, 1000);
                        }

                    ).catch(err=>res.status(500).send("fetch error:" + err))
            }else{
                res.status(404).send("No shoppingcart for this user to buy");
            }
        })
        .catch(err => {
            console.error(`Getting shoppingcart for user ${req.params.email}: ${err}`);
            res.status(500).send(`Getting shoppingcart for user ${req.params.email}: ${err}`);
        });

});


setTimeout(initialSetup, 5000);

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Node server listening on port ${port}`);
});
