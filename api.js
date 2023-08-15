const express=require('express');
const { checkauth, createUser, getfoodlist, getfooddetails, getbabysitterdetails, getbabysitteritem, uploadfood, getProfileDetails, updateProfilePicture, updateProfile, uploadProjects, getProjectlist, getProjectDetails, requestbit, acceptbidder, loadmessage, sendmessage, submitreview, cashreq, loadb, videolist, uploadvideo, uploadlike, sendcomment, commentlist, loadnotification, updateuserData, checktoken, professionallist, loadprevmsg, chatidlist, savemsg } = require('./database');
const r=express.Router()
module.exports= r;

r.use("*",async(req,res,next)=>{
let cookie=req.headers.cookie || req.headers.authorization;
let user=await checktoken(cookie)
if(!user||user?.length<=0){
    res.json({status:'Failed due to wrong cookie'});
    return ;
}

req.app.locals.user=user;
next()
})



r.post('/updateuserdata',async(req,res)=>{

    const {location,workdistance,servicecatagory}=req.body;
    if(!location||!workdistance||!servicecatagory){
        res.json({status:'Failed to do this'});
        return;
    }
    let user=req.app.locals.user;
    let da=await updateuserData(location,workdistance,servicecatagory,user);
    if(da){
        res.json({status:'OK'})
    }else{
        res.json({status:'Failed to upload!'})
    }

})






// Note: no payment method added yet.It will need payment method.

// r.get('/getcurrentcredit',async(req,res)=>{
//     let user=req.app.locals.user;
//     let data=user.credit;
//     if(data){
//         res.send(data);
//     }else{
//         res.send('Sorry no data found');
//     }
// })



// r.get('/getcreditofferlist',async(req,res)=>{
//     let user=req.app.locals.user;
//     let data=await getCreditOffers(user);
//     if(data){
//         res.json(data);
//     }else{
//         res.json({msg:'Sorry no data found'});
//     }
// })













r.get('/loadprofile',async(req,res)=>{
    let user=req.app.locals.user;
    delete user.pass;
    let data=user;
    if(data){
        res.json(data);
    }else{
        res.json({msg:'Sorry no data found'});
    }
})





r.get('/getprofessionaldata',async(req,res)=>{
    let user=req.app.locals.user;
    let data=user;
    delete data.pass;
    if(data){
        res.json(data);
    }else{
        res.json({error:'data requirement action'});
    }
})




r.post('/loadprevmsg',async(req,res)=>{
    const {receiver}=req.body;
    if(!receiver){
        res.send("Something went wrong")
        return;
    }
    let user=req.app.locals.user;
    let data=await loadprevmsg(user.uid,receiver);
    if(data){
        res.json(data);
    }else{
        res.json({error:'Failed to load data'});
    }
})





r.get('/chatidlist',async(req,res)=>{
    let user=req.app.locals.user;
    let data=await chatidlist(user.uid);
    if(data){
        res.json(data);
    }else{
        res.json({error:'Failed to load data'});
    }
})

r.post('/savemsg',async(req,res)=>{
    let user=req.app.locals.user;
    let {receiver,msg}=req.body;
    if(!receiver || !msg){
        res.send('Failed to process')
        return ;
    }
    let data=await savemsg(user,receiver,msg)
    if(data){
        res.json({status:data})
    }else{
        res.json({status:'Failed'})
    }
})






r.post('/loadprofessionallist',async(req,res)=>{
    const {query}=req.body;
    if(!query){
        res.send({status:'Failed to process'});
    }

    let data=await professionallist(query);
    res.json(data);

})











