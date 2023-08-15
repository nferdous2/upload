const mailer=require('nodemailer');
let trans=mailer.createTransport({
    host:"mail.professionalbd.org",
    port:"465",
    secure: true,
    auth:{
        user:'support@professionalbd.org',
        pass:'c4}M?6Fl2yqA'
    }
})
let crypto = require('crypto');
const mysql = require("sqlite3").verbose();
let fs=require("fs");
const { send } = require('process');


const con = new mysql.Database("Database.db", (error) => {
  if (error) {
    return console.error(error.message);
  }
  con.exec("CREATE TABLE IF NOT EXISTS normaluser(uid INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,mobile TEXT,email TEXT,pass TEXT,gender TEXT,country TEXT,district TEXT,zip TEXT,category TEXT,subcategory TEXT,education TEXT,token TEXT,balance INTEGER DEFAULT 0,img TEXT,profile TEXT DEFAULT 0,details TEXT,skills TEXT,varified INTEGER DEFAULT 0,credit INTEGER DEFAULT 0,codeofv TEXT);")
  con.exec("CREATE TABLE IF NOT EXISTS messages(uid INTEGER PRIMARY KEY AUTOINCREMENT,sender TEXT,receiver TEXT,msg TEXT,time TEXT);")
  con.exec("CREATE TABLE IF NOT EXISTS chatid(uid INTEGER PRIMARY KEY AUTOINCREMENT,suid TEXT,rname TEXT,ruid TEXT,ricon TEXT,time TEXT);")

    // con.exec("CREATE TABLE IF NOT EXISTS offers(uid INTEGER PRIMARY KEY AUTOINCREMENT,price TEXT,credit TEXT);")
  console.log("Connection with Database has been established");
});


  
  



async function getData(cmd,arg){
  let p= await new Promise((response,error)=>{
    con.all(cmd,arg, function (err, result) {
      if (err){ error(err); return;}
      response(result);
    });
  })
  return p;
  
}

exports.updateuserData=async (location,workdistance,servicecatagory,user)=>{
      await getData('UPDATE normaluser SET location=?,workdistance=?,servicecatagory=? WHERE uid=?',[location,workdistance,servicecatagory,user.uid])
      
        return "OK"
  }



//Note: no app interface found for update profile.

// async function updateProfilePicture(pic,token){
//   let name=await getData('SELECT img FROM normaluser WHERE token=?;',[token]);
//   if(name.length<=0){
//     return ;
//   }else{
//     await saveimagewithname(pic,name[0].img);
//     return 'OK';
//   }
// }






// Note: no payment method added yet.It will need payment method.
// exports.getCreditOffers=async()=>{
//   const cmd="SELECT * FROM offers";
//   let data=await getData(cmd,[]);
//   return data;
// }





exports.checktoken=async(token)=>{
  const cmd="SELECT * FROM normaluser WHERE token=?;"
  let data=await getData(cmd,[token])
  if(data&&data.length>0&&data[0].uid){
    return data[0];
  }else{
    return undefined;
  }
}




function namespaceremover(name){
  
  let res='';
  for (let i=0;i<name.length;i++){
    if((name[i]>='a'&&name[i]<='z')||(name[i]>='A'&&name[i]<='Z'))res+=name[i];}
  return res.toLowerCase();
}


exports.loadprevmsg=async(sender,receiver)=>{
const cmd='SELECT * FROM messages WHERE (sender=? AND receiver=?) OR (sender=? AND receiver=?)';
let data=await getData(cmd,[sender,receiver,receiver,sender])
return data;
}

exports.chatidlist=async(uid)=>{
  const cmd='SELECT * FROM chatid WHERE suid=?';
  let data=await getData(cmd,[uid])
  return data;
}


exports.verifymailcode=async(mail,code)=>{
  const cmd='SELECT uid FROM normaluser WHERE email=? AND codeofv=?';
  let data=await getData(cmd,[mail,code]);
  if(data&&data.length>0){
    
      await getData('UPDATE normaluser SET varified=1 WHERE uid=?',[data[0].uid]);
      return 'OK'
    
  }else{
    return undefined;
  }
}




exports.createUser=async(name,mobile,email,pass,gender,country,district,zip,category,subcategory,education)=>{
  // name,mobile,email,pass,gender,country,district,zip,category,subcategory,education
  let upass=crypto.createHash('sha256').update(pass).digest('base64');
  const cmd="SELECT uid FROM normaluser WHERE email=?;";
  let data=await getData(cmd,[email]);
  let vcode = ""+crypto.randomInt(100000,1000000).toString();
  if(data&&data.length>0&&data[0].uid){
    return "This email already exists.";
  }else{
    await getData("INSERT INTO normaluser (name,mobile,email,pass,gender,country,district,zip,category,subcategory,education) VALUES (?,?,?,?,?,?,?,?,?,?,?);",[name,mobile,email,upass,gender,country,district,zip,category,subcategory,education])
    let da=await getData('SELECT uid FROM normaluser WHERE email=?',[email]);

    await getData('UPDATE normaluser SET profile=? ,img=?, codeofv=? WHERE uid=?',[namespaceremover(name)+''+da[0].uid,namespaceremover(name)+''+da[0].uid+'.jpg',vcode,da[0].uid])
    await sendCodeMail(email,vcode,name);
    return "OK";
  }

}

async function sendCodeMail(mail,code,name){
  let mailop = {
    from: '"Support Team" <support@professionalbd.org>',
    to: mail,
    subject: 'Verification code from Professionalbd',
    text: 'Hi '+name+', Please verify your account with this code:'+code+'.Do not share this code with anyone else.',
    html: '<b>Hi '+name+',</b><br>Please verify your account with this code:<br><h1>'+code+"</h1><br><i>Do not share this code with anyone else.</i>"
};
trans.sendMail(mailop,(err,info)=>{
    if(err){
        console.log("There is some error");
        console.log(err);
    }
})
}




exports.savemsg=async (sender,receiver,msg)=>{
    let rc=await getData('SELECT * FROM normaluser WHERE uid=?',[receiver])
    if(rc.length>0){
      let rec=rc[0];
      await getData('INSERT INTO messages (sender,receiver,msg,time) VALUES (?,?,?,?)',[sender.uid,rec.uid,msg,Date.now()])
      let check=await getData('SELECT * FROM chatid WHERE suid=?',[sender.uid])
      if(check.length>0){
        await getData('UPDATE chatid SET time=? WHERE uid=?',[Date.now(),check[0].uid])
      }else{
        await getData('INSERT INTO chatid (suid,rname,ruid,ricon,time) VALUES(?,?,?,?,?)',[sender.uid,rec.name,rec.uid,rec.img,Date.now()])
      }
      
      check=await getData('SELECT * FROM chatid WHERE suid=?',[rec.uid])
      if(check.length>0){
        await getData('UPDATE chatid SET time=? WHERE uid=?',[Date.now(),check[0].uid])
      }else{
        await getData('INSERT INTO chatid (suid,rname,ruid,ricon,time) VALUES(?,?,?,?,?)',[rec.uid,sender.name,sender.uid,sender.img,Date.now()])
      }
      return 'OK'

    }
    return undefined;
}


exports.checkauth=async(user,pass)=>{
    let upass=crypto.createHash('sha256').update(pass).digest('base64');
    let salt = crypto.randomBytes(27).toString('hex'); 
    
    const cmd="SELECT uid FROM normaluser WHERE email=? AND pass=? AND varified=1;"
    let data=await getData(cmd,[user,upass])
    if(data&&data.length>0&&data[0].uid){
      await getData("UPDATE normaluser SET token=? WHERE uid=?;",[salt,data[0].uid])
      return {cookie:salt};
    }else{
      return undefined;
    }

}


exports.professionallist=async(query)=>{
  let qu="%"+query+"%";
  let cmd="SELECT * FROM normaluser WHERE UPPER(name) LIKE UPPER(?) OR UPPER(subcategory) LIKE UPPER(?) OR UPPER(category) LIKE UPPER(?)"
  let data=await getData(cmd,[qu,qu,qu])
  // userid,name,ratings,servicecatagory,profileicon,activestatus
  let res=[]
  for (let i=0;i<data.length;i++){
    res.push({userid:data[i].uid,name:data[i].name,ratings:'0.0',servicecatagory:data[i].category,profileicon:data[i].img,activestatus:false})
  }
  return res;
}




//Note: no iterface found for image update.
// async function saveimage(img){
//   let base64Data = img.replace(/^data:image\/\w+;base64,/, "");
//   let name="image"+Date.now()+".jpg"
//   return await new Promise((res,erro)=>{
//     fs.writeFile('images/'+name, base64Data, 'base64', function(err) {
//       if(err){
//         erro(err)
//       }else{
//         res(name)
//       }
    
//     });
//   })
  
// }


//Note: no iterface found for image update.
// async function saveimagewithname(img,name){
//   let base64Data = img.replace(/^data:image\/\w+;base64,/, "");
//   return await new Promise((res,erro)=>{
//     fs.writeFile('images/'+name, base64Data, 'base64', function(err) {
//       if(err){
//         erro(err)
//       }else{
//         res(name)
//       }
    
//     });
//   })
  
// }





