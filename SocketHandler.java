import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;

public class SocketHandler{

    static final int SENDMSG=10;
    static final int CALL=11;
    static final int DECLINECALL=12;
    static final int ACCEPTCALL=13;
    static final int INVALIDCALLACCEPTENCE=14;



    public static class UserData{
        private Socket sock;
        private InputStream is;
        private OutputStream os;
        private String name,uid,profileicon;
        private String cookie;
        public UserData(Socket sock,InputStream is,OutputStream os,String name,String uid,String profileicon,String cookie){
            this.sock=sock;
            this.is=is;
            this.os=os;
            this.name=name;
            this.uid=uid;
            this.cookie=cookie;
            this.profileicon=profileicon;

        }
        public String getCookie(){
            return cookie;
        }
        public Socket getSocket(){
            return sock;
        }
        public InputStream getInputStream(){
            return is;
        }
        public OutputStream getOutputStream(){
            return os;
        }
        public String getName(){
            return name;
        }
        public String getUid(){
            return uid;
        }
        public String getProfileImage(){
            return profileicon;
        }

    }



    public static void main(String args[]) throws Exception{
        ServerSocket msg=new ServerSocket(5500);
        ArrayList<UserData> list=new ArrayList<>(); 
        Thread newreq=new Thread(){
            @Override
            public void run(){
                while(true){
                    try{
                    Socket sock=msg.accept();
                    InputStream is=sock.getInputStream();
                    for(int i=0;i<10;i++){
                        if(is.available()>0)break;
                        sleep(1000);
                    }
                    String data="";
                    while(is.available()>0){
                        byte b=(byte)is.read();
                        if(b==0)break;
                        data+=new String(new byte[]{b},0, 1);
                    }
                    System.out.println(data);
                    String profile=sendGet("/api/loadprofile", data);
                    
                    JSONHandler.JSONObject jo=new JSONHandler.JSONObject(profile);
                    if(jo.getValue("error")==null){
                        UserData ud=new UserData(sock, sock.getInputStream(),sock.getOutputStream(), jo.getValue("name"), jo.getValue("uid"), jo.getValue("img"), data);
                        list.add( ud);
                        sock.getOutputStream().write("OK\0".getBytes());
                        sock.getOutputStream().flush();
                    }
                    }catch(Exception e){}
                }
            }
        };
        newreq.start();



        Thread checker=new Thread(){
            @Override
            public void run(){
                while(true){
                    try{
                    if(list.size()<=0){
                        sleep(200);
                        continue;
                    }


                    for(UserData ud:list){
                        try{
                        if(ud.getInputStream().available()>0){
                            int cmd=ud.getInputStream().read();
                            String da=readMsg(ud.getInputStream());
                            if(cmd==SENDMSG){
                                String receiver=da.split(":")[0];
                                String imsg=da.replaceFirst(receiver+":", "");
                                System.out.println(imsg);
                                for(int i=0;i<list.size();i++){
                                    UserData u=list.get(i);
                                    if(u.getUid().equals(receiver)){
                                        try{
                                        System.out.println("User is online");
                                        u.getOutputStream().write(SENDMSG);
                                        u.getOutputStream().write((""+ud.getUid()+"\0"+ud.getName()+"\0"+ud.getProfileImage()+"\0"+imsg+"\0").getBytes());
                                        u.getOutputStream().flush();
                                        
                                    }catch (Exception e){
                                        try{
                                        list.remove(i);
                                        System.out.println(e.toString());
                                        }catch (Exception ee){}
                                    }
                                    }
                                }
                            
                            try{
                                imsg=filterMSG(imsg);
                            }catch(Exception e){
                                System.out.println(e.toString());
                            }
                                System.out.println("imsg:"+imsg);
                                String body="{\"receiver\":\""+receiver+"\",\"msg\":\""+imsg+"\"}";
                                System.out.println("Body:"+body);
                                sendPost("/api/savemsg", body, ud.getCookie());
                            }else if(cmd==CALL){
                                //todo need to work
                            }
                        }
                        }catch(Exception e){
                            try{
                                ud.getSocket().close();
                            }catch(Exception ee){

                            }
                            list.remove(ud);
                        }
                    }

                    sleep(50);

                }catch(Exception e ){}
                }
            }
        };
        checker.start();
    }





    private static String sendPost (String path,String jsonObject,String cookie) throws Exception {
        URL url = new URL("http://localhost"+path);

        

        // Create the connection
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        if(cookie!=null){
            connection.addRequestProperty("cookie",cookie);}

        // Create the connection
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        // Write the request body to the connection's output stream
        OutputStream outputStream = connection.getOutputStream();
        outputStream.write(jsonObject.getBytes());
        outputStream.flush();
        outputStream.close();
        connection.connect();
        // Get the response from the connection's input stream
        InputStream inputStream = connection.getInputStream();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            response.append(line);
        }
        bufferedReader.close();
        inputStream.close();

        return response.toString();
    }
    private static String sendGet (String path,String cookie) throws  Exception{
        URL url = new URL("http://localhost"+path);


        


        // Create the connection
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();

        if(cookie!=null){
            connection.addRequestProperty("cookie",cookie);}

        connection.setRequestMethod("GET");
        connection.setDoOutput(false);
        connection.connect();
        // Get the response from the connection's input stream
        InputStream inputStream = connection.getInputStream();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            response.append(line);
        }
        bufferedReader.close();
        inputStream.close();

        return response.toString();
    }

public static String readMsg(InputStream is)throws Exception{
    String msg="";
    while(is.available()>0){
        byte b=(byte)is.read();
        if(b==0)break;
        msg+=new String(new byte[]{b},0, 1);
    }
    System.out.println(msg);
    return msg;
}





public static String filterMSG(String msg){
    String fil="";
    for(int i=0;i<msg.length();i++){
        if(msg.charAt(i)=='\\'){
            fil+="\\\\";
        }else{
            fil+=msg.charAt(i);
        }
    }
    String againfil="";
    for(int i=0;i<fil.length();i++){
        if(fil.charAt(i)=='"'){
            againfil+="\\\\\"";
        }else{
            againfil+=fil.charAt(i);
        }
    }
    return againfil;
}


}