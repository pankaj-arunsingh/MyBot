const builder=require('botbuilder');
const restify=require('restify');

//Bot Creation
const connector=new builder.ChatConnector();
const bot= new builder.UniversalBot(
    connector,
    [
        (session)=> {
           // session.send('Hello Pankaj! I am your bot!');
           //builder.Prompts.text(session,`Welcome to be amazed. Hello ! What is your name?`);
            session.beginDialog('ensureProfile',session.userData.profile);
     },
           (session,results)=>{
               const profile=session.userData.profile=results.response;
               session.endConversation(` Hello, ${profile.name}.
               I Love ${profile.company}!`);
           }
    ]
);

bot.dialog('ensureProfile',[
    (session,args,next)=>{
        session.dialogData.profile=args||{};
        if(!session.dialogData.profile.name){
            builder.Prompts.text(session,`What's your name?`);
        }else{
            next();
        }
    },
    (session,results,next)=>{
        if(results.response){
            session.dialogData.profile.name=results.response;
        }
        if(!session.dialogData.profile.company){
            builder.Prompts.text(session,`What company do you work for?`);
        }else{
            next();
        }
    },
    (session,results)=>{
        if(results.response){
            session.dialogData.profile.company=results.response;
        }
        session.endDialogWithResult({response:session.dialogData.profile})
    }
])
// Go to this for sample bots and bot directory and docmenttaton 
//https://bots.botsframework.com
//creating web hosting server
const server=restify.createServer();
server.post('/api/messages',connector.listen());
server.listen(
process.env.PORT ||3978,
()=>console.log('Server is up and running')
);