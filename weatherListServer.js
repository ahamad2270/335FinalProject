const path = require("path")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const { Collection } = require("mongodb")
require("dotenv").config({path: path.resolve(__dirname,".env")})
let portNum = 5001
const uri = process.env.MONGO_CONNECTION_STRING
const databaseAndCollection = {db:"sCMSC335_DB",collection:"shoppingList"}
const {MongoClient,ServerApiVersion} = require('mongodb')
const client = new MongoClient(uri, {serverAPI:ServerApiVersion.v1})

app.set("views", path.resolve(__dirname,"templates"))
app.set("view engine","ejs")
process.stdin.setEncoding("utf8")
app.use(bodyParser.urlencoded({extended:false}))
app.use(express.static(path.join(__dirname, 'public')))

process.stdout.write(`Web server started and running at http://localhost:${portNum}\n`)
process.stdout.write("Type stop to shutdown the server:")
process.stdin.on("readable", function(){
    let dataInput = process.stdin.read();
    if(dataInput != null){
        dataInput = dataInput.trim()
        if(dataInput == "stop"){
            process.stdout.write("Shutting down the server\n")
            process.exit(0)
        }
        else{
            process.stdout.write(`Invalid Command: ${dataInput} \n`)
        }
    }
    process.stdout.write("Type stop to shutdown the server:")
process.stdin.resume()
})
try{
client.connect()
app.get("/",(request,response) => {
response.render("index")
})

//Page to request items
app.get("/getItems",(request,response) => {
       response.render("askEmail") 

})

//Page to add items
app.post("/addItems",(request,response) => {
    let x = "";
    let items = request.body.recItems
    let itemArray  =items.split(",")
    itemArray.forEach(element => {
        x+= `<option selected=\"selected\" value=\"${element}\"> ${element} </option>`
    });



    const variables = {
        options:x
    }

    response.render("itemSelection",variables) 

})
//Added Items
app.post("/list",(request,response) => {
    ( async () => {
        let x = "<ul>";
        let items = request.body.items
        let itemArray;
        if(Array.isArray(items)){
            itemArray = items
            itemArray.forEach(element => {
                x+= `<li> ${element} </li>`
            });
        
        }
        else{
            itemArray = [items]
            x += `<li> ${items} </li>`
        }
        x += "</ul>"
       
        
        let filter = {user: request.body.user}
        const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter)
        const result = await cursor.toArray()
        let newItems = []
        result.forEach(element => {
                newItems = element.items
            }
        )
        
        data = {
            user: request.body.user,
            items: Array.from(new Set(newItems.concat(itemArray)))
        }
        filter = {user: request.body.user}
        let deleteCursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany(filter)
        insertItem(client,databaseAndCollection,data)
        response.send("Added the following items to "+ request.body.user +"'s shopping list:" + x+ "<br><br> <a href = \"/\">← Go Home</a>") 
})()})
//Retrieving Items
app.post("/getList",(request,response) => {
    ( async () => {
        let filter = {user: request.body.user}
        const cursor = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter)
        const result = await cursor.toArray()
        let x = ""
        if(result.length > 0){
            x += "<ul>";
            let itemArray = result[0].items;
            itemArray.forEach(element => {
                x += `<li> ${element} </li>`
            });
            x += "</ul>"
        } else {
            x = "No items found"
        }
        const variables = {items : x}
        response.render("yourItems",variables)
   })()
})
}
catch{
    console.log("error")
}

function insertItem(client, databaseAndCollection, data){
    const result = client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(data)
}
app.listen(portNum)

