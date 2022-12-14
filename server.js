const express= require("express");
const app= express();
const bodyParser=require("body-parser");
const {save_user_information} = require('./models/server_db');
const path=require('path');
const publicPath = path.join(__dirname,'./public');
const paypal=require('paypal-rest-sdk');
const session = require('express-session');

app.use(bodyParser.json());
app.use(express.static(publicPath));
app.use(session(
  {secret : 'my web app',
cookie : {maxAge : 60000}
}
));
/*paypal configuration*/
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AdCEjhwcOAQD5R7c_753RoFBfhnypm1KH1NB7CptCn_UzKVH9KVcfQWBYJ9NGv_Z8RMUFxbNjoYy-L8m',
  'client_secret': 'EDKCLSK4O5QDn4T48TdO13XJ_rFSoZLoFnPT4hF1OBl67Ihdps51kZd_rNhB_3VDLkOmwDVPy70ITx5R'
});

app.post('/post_info', async (req,res)=>{
   var email=req.body.email;
   var amount=req.body.amount;

   if (amount<=1){
     return_info={};
     return_info.error=true;
     return_info.message="The amount should be greater than 1";
     return res.send(return_info);
   }
  var fee_amount = amount * 0.9;
  var result = await save_user_information({"amount":amount,"email":email});
  req.session.paypal_amount = amount;
  var create_payment_json = {
   "intent": "sale",
   "payer": {
       "payment_method": "paypal"
   },
   "redirect_urls": {
       "return_url": "http://localhost:3000/success",
       "cancel_url": "http://localhost:3000/cancel"
   },
   "transactions": [{
       "item_list": {
           "items": [{
               "name": "Lottery",
               "sku": "Funding",
               "price": amount,
               "currency": "USD",
               "quantity": 1
           }]
       },
       "amount": {
           "currency": "USD",
           "total": req.session.paypal_amount
       },
       "payee":{
         'email': winner_email
       },
       "description": "paying the winner of the lottery application"
   }]
};


paypal.payment.create(create_payment_json, function (error, payment) {
   if (error) {
       throw error;
   } else {
       console.log("Create Payment Response");
       console.log(payment);
       for (var i=0; i< payment.links.length;i++){
         if(payment.links[i].rel == 'approval_url'){
           return res.send(payment.links[i].href);
         }
       }
   }
});



});

app.get('/success',(req,res)=>{
   const payerId = req.query.PayerID;
   const paymentId = req.query.paymentId;
   var execute_payment_json ={
     "payer_Id": payerId,
     "transactions":[{
       "amount":{
         "currency":"USD",
         "total":100
       }
     }]
   };


app.get("/get_total_amount", async (req,res)=>{
   var result = await get_total_amount();
  res.send(result);
});

app.get('/pick_winner',async (req,res)=>{
  var result = await get_total_amount();
  var total_amount = result[0].total_amount;
 req.session.paypal_amount =total_amount;
})




app.listen(3000,()=>{
   console.log('server is running on port 3000');

});
