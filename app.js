require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// =========== Database Configuration ============ //

// Connect App to LOCAL Database
// mongoose.connect("mongodb://localhost:27017/posts", {useNewUrlParser: true});

// Connect App to MONGO ATLAS Database
const mongoAtlasKey = process.env.MONGO_ATLAS_KEY;
mongoose.connect(mongoAtlasKey, {useNewUrlParser: true});


// Post Schema
const postSchema = {
  alertId: String, 
  alertTicker: String, 
  alertPrice: String, 
  alertSignal: String,
  alertDate: String,
  walletData: String
};

// Post Model
const Post = mongoose.model("Post", postSchema);

// =========== Paperboy Data Configuration ============ //
let algo = {
  algoName: "Paperboy Algo 1",
  buyRate: 1,
  connection: undefined,
  duration: 0,
  gainLoss: 0,
  lastPrice: 0,
  nextMove: undefined,
  profitLoss: 0,
  sellRate: 1,
  trades: 0
}

let chart = {
  connectionStatus: undefined,
  currPrice: undefined,
  ticker: 'none',
  timeFrame: ['1m', '3m', '5m', '10m', '15m', '30m', '1h', '2h', '4h', '1d'],
}

let wallet = {
  accountValue: 0,
  cash: 1000,
  tokens: 0,
}
 

// ============== Configure Datetime =============== //
const date = new Date();

function getDate(){

    // Get date
    let month = date.getMonth();
    let day = date.getDate();
    let year = date.getFullYear();

    let dateString = (month + "-" + day + "-" + year);

    // Get time
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    let timeString = (hours + ":" + minutes + ":" + seconds);

    console.log(dateString + " " + timeString);
    return (dateString + " " + timeString)
};

// ============== Server Functions =============== //

app.use(express.json()); // allow app to receive JSON Data


// define home route
// sends data to hompage for display to user
app.get("/", function(req, res){
  res.render("home", {
    algo: algo,
    chart: chart,
    wallet: wallet,
  });
});


// route for receiving trading view alerts
// unpacks json data and sends to paperboy()
app.post('/alert', (req, res) => {
  console.log("");
  console.log("Recived new" + req.body.action + "alert from Trading View!");
  console.log(req.body);  // log Raw alert
  // example format -> { ticker: 'MATICUSDT', action: 'Sell', price: '0.9634' }

  let alert = { // Compile Alert Object
    ticker: req.body.ticker, // 'MATICUSDT'
    action: req.body.action, // 'Sell' or 'Buy'
    price: req.body.price    // '0.9235'
  }
  paperBoy(alert); // Alert PaperBoy

  const newPost = new Post({ // Save Alert to Database
    alertId: '', 
    alertTicker: alert.ticker, 
    alertPrice: alert.price, 
    alertSignal: alert.action,
    alertDate: getDate(),
    walletData: wallet.accountValue.toString()
  });
  
  newPost.save((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Alert saved to database');
    }
  })

  return res.status(200).json({ ok: true }) ;  // Return OK to server

});

// ============= Buy / Sell Actions ============== //

function paperBoy(alert){

  if (alert.action === "Buy"){ //create new BUY order

      // determine amount to buy & prepare order
      const orderAmount = (wallet.cash * algo.buyRate);
      const tokenAmount = (orderAmount / alert.price);
      // place order
      buy(orderAmount, tokenAmount);


  } else if (alert.action === "Sell"){ //create new SELL order

      // determine amount to buy & prepare order
      let orderAmount = (wallet.tokens * algo.sellRate);
      let cashAmount = (orderAmount * alert.price);
      // place order
      sell(orderAmount, cashAmount)
  }

  updateReports(alert); // update reports
};

function buy(orderAmount, tokenAmount){
  //update wallet
  wallet.cash -= orderAmount;
  wallet.tokens += tokenAmount;
};

function sell(orderAmount, cashAmount){
  //update wallet
  wallet.cash += cashAmount;
  wallet.tokens -= orderAmount;
};

function updateReports(alert){
  algo.lastPrice = alert.Price;
  algo.trades += 1;
  chart.ticker = alert.ticker;
  chart.timeFrame = undefined;
  wallet.accountValue = "$" + (wallet.cash + (wallet.tokens * alert.price)).toFixed(2);
};

// ============================================ //
// Server startup logs
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
});
