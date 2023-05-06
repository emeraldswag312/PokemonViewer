const fetch = require("node-fetch");
const http = require("http");
const path = require("path"); 
const express = require("express");
const app = express();
const bodyParser = require("body-parser"); 
const fs = require('fs');
const portNumber = 5001;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false})); 
app.use(express.static(path.join(__dirname, 'public')));

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION}; 
const userName = process.env.MONGO_DB_USERNAME; 
const password = process.env.MONGO_DB_PASSWORD; 
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://auppugun335:auppuguncmsc335@cluster0.fqtonps.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get("/", (request, response) => {
    response.render("index");
});

app.post("/viewPokemon", async (request, response) => {
    let pokemonData = await fetchPokemon(request.body.pokemon);

    if (typeof pokemonData === "string" && pokemonData === "INVALID") {
        response.render("404");
    } else {
        let variable = {
            pokemon: pokemonData.name,
            artwork: pokemonData.sprites.front_default
        }
        response.render("viewPokemon", variable);
    }
});

app.get("/savedPokemon", (request, response) => {
   response.render("savedPokemon");
});

app.post("/savedUser", async (request, response) => {
    let pokemonData = await fetchPokemon(request.body.favoritepokemon);

    if (typeof pokemonData === "string" && pokemonData === "INVALID") {
        response.render("404");
    } else {
        let variable = {
            name: request.body.user,
            pokemon: pokemonData.name
        }
        let user = {name: request.body.user, favorite: pokemonData.name};
        await insertUser(user); 
        response.render("savedUser", variable);
    }
});

app.get("/viewFavorite", (request, response) => {
    response.render("viewFavorite");
});

app.get("/changeFavorite", (request, response) => {
    response.render("changeFavorite");
})

app.post("/changedUser", async (request, response) => {
    let pokemonData = await fetchPokemon(request.body.changedpokemon);
    let filter = {name: request.body.user}
    let foundUser = await findUser(filter);

    if ((typeof pokemonData === "string" && pokemonData.includes("INVALID")) || foundUser == null) {
        response.render("404");
    } else {
        let variable = {
            name: request.body.user,
            pokemon: pokemonData.name
        }
        await deleteUser(filter);
        let user = {name: request.body.user, favorite: pokemonData.name};
        await insertUser(user); 
        response.render("changedUser", variable);
    }
});

app.post("/accessFavorite", async (request, response) => {
    let filter = {name: request.body.user}
    let foundUser = await findUser(filter);

    if (foundUser === null) {
        response.render("404");
    } else {
        let variable = {
            pokemon: foundUser.favorite
        }
        response.render("accessFavorite", variable);
    }
});

app.listen(portNumber);
console.log(`Web server launched`); 

async function fetchPokemon(name) {
    let dashName = name.replace(/\s/g, "-");
    let pokemonName = dashName.toLowerCase();
    const link = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
    const response = await fetch(link);

    if (response.status === 404) {
        return "INVALID";
    } else {
        let data = await response.json();
        return data;
    }
}

async function insertUser(user) {
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(user);
}

async function deleteUser(user) {
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteOne(user); 
}

async function findUser(user) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(user);
    return result;
}

