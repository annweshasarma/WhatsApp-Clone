
import express from "express";
import mongoose from "mongoose";
import Messages from './dbMessages.js'
import Pusher from "pusher";
import cors from "cors";
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1181207",
    key: "3ec71598de614e98f34a",
    secret: "146384587c5dc5069c34",
    cluster: "eu",
    useTLS: true
  });

app.use(express.json());
app.use(cors());


const conn_url ='mongodb+srv://root:root@cluster0.smlnk.mongodb.net/chatappdb?retryWrites=true&w=majority';

mongoose.connect(conn_url ,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true
});

const db = mongoose.connection;

db.once("open" , () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change" , (change) => {
    console.log(change);

    if(change.operationType === "insert"){
        const messageDetails = change.fullDocument;
        pusher.trigger("messages" , "inserted",
           {
             name: messageDetails.name,
             message:messageDetails.message,
             timestamp:messageDetails.timestamp,
             received:messageDetails.received,
           });
        } else{
            console.log("Error triggering Pusher");
        }

    });

    

});

app.get('/' , (req , res)=>
res.status(200).send("hello"));


 app.get("/messages/sync" , (req , res) => {
     Messages.find((err , data) => {
         if(err){
             res.status(500).send(err);
         } else{
             res.status(200).send(data);
         }
     });
 });







app.post("/messages/new" , (req , res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage , (err , data) => {
        if(err){
            res.status(500).send(err);
        } else{
            res.status(201).send(data);
        }
    });
});


app.listen(port ,() =>console.log(`Listening on port :${port}`));