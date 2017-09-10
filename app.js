const builder=require('botbuilder');
const restify=require('restify');

//Bot Creation
const connector=new builder.ChatConnector();
const bot= new builder.UniversalBot(
    connector,
    [
        (session)=> {
           // session.send('Hello Pankaj! I am your bot!');
           builder.Prompts.text(session,`Welcome to be amazed. Hello ! What is your name?`);
        },
           (session,results)=>{
               session.endDialog(` Hello, ${results.response}`);
           }
    ]
);

// Go to this for sample bots and bot directory and docmenttaton 
//https://bots.botsframework.com
//creating web hosting server
const server=restify.createServer();
server.post('/api/messages',connector.listen());
server.listen(
process.env.PORT ||3978,
()=>console.log('Server is up and running')
);