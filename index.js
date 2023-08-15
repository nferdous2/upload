



const express=require('express');
const { checkauth, createUser, verifymailcode } = require('./database');
const AllApi =require('./api')
const cors=require('cors');
const app=express();
app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({limit: '50mb'}));
app.use(cors())

app.use('/images',express.static('images'))





app.use('/api',AllApi);



app.post('/login',async(req,res)=>{
    let {user,pass}=req.body;
    if(!user||!pass){
        res.json({status:"Failed to get data."})
        return ;
    }
    
    let data=await checkauth(user,pass);
    if(data){
        res.send({msg:"OK",cookie:data.cookie});
    }else{
        res.json({msg:"Wrong email or password."});
    }
    
})






app.post('/signup',async(req,res)=>{
    let {name,mobile,email,pass,gender,country,district,zip,category,subcategory,education}=req.body;
    

    let data=await createUser(name,mobile,email,pass,gender,country,district,zip,category,subcategory,education);
    if(data=='OK'){
        res.send(data);
    }else{
        res.send(data);
    }
})


app.listen(80);






app.post('/verifycode',async(req,res)=>{

    const {mail,code}=req.body;
    if(!mail||!code){
        res.json({status:'Failed to do this'});
        return;
    }
    
    let da=await verifymailcode(mail,code);
    if(da){
        res.json({msg:'OK'})
    }else{
        res.json({msg:'Failed to verify your code!'})
    }
})








