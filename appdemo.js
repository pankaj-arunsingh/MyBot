var restify = require('restify');
var builder = require('botbuilder');
//var buildService = require('./buildServiceWrapper');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());


// Create your bot with a function to receive messages from the user.
// This default message handler is invoked if the user's utterance doesn't
// match any intents handled by other dialogs.
var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send("Hi... I'm the note bot sample. I can create new notes, read saved notes to you and delete notes.");

   // If the object for storing notes in session.userData doesn't exist yet, initialize it
   if (!session.userData.notes) {
       session.userData.notes = {};
       console.log("initializing userData.notes in default message handler");
   }
});

// Add global LUIS recognizer to bot
var luisAppUrl = process.env.LUIS_APP_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/cfeb2141-756a-48a2-bd6a-a6c5ddb9bf22?subscription-key=f6ce7750b68949a5b30557e1796dea27&staging=true&timezoneOffset=0&verbose=true&q=';
bot.recognizer(new builder.LuisRecognizer(luisAppUrl));


// CreateNote dialog
bot.dialog('CreateNote', [
    function (session, args, next) {
        // Resolve and store any Note.Title entity passed from LUIS.
        var intent = args.intent;
        var title = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');

        var note = session.dialogData.note = {
          title: title ? title.entity : null,
        };
        
        // Prompt for title
        if (!note.title) {
            builder.Prompts.text(session, 'What would you like to call your note?');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var note = session.dialogData.note;
        if (results.response) {
            note.title = results.response;
        }

        // Prompt for the text of the note
        if (!note.text) {
            builder.Prompts.text(session, 'What would you like to say in your note?');
        } else {
            next();
        }
    },
    function (session, results) {
        var note = session.dialogData.note;
        if (results.response) {
            note.text = results.response;
        }
        
        // If the object for storing notes in session.userData doesn't exist yet, initialize it
        if (!session.userData.notes) {
            session.userData.notes = {};
            console.log("initializing session.userData.notes in CreateNote dialog");
        }
        // Save notes in the notes object
        session.userData.notes[note.title] = note;

        // Send confirmation to user
        session.endDialog('Creating note named "%s" with text "%s"',
            note.title, note.text);
    }
]).triggerAction({ 
    matches: 'Note.Create',
    confirmPrompt: "This will cancel the creation of the note you started. Are you sure?" 
}).cancelAction('cancelCreateNote', "Note canceled.", {
    matches: /^(cancel|nevermind)/i,
    confirmPrompt: "Are you sure?"
});

// Delete note dialog
bot.dialog('DeleteNote', [
    function (session, args, next) {
        if (noteCount(session.userData.notes) > 0) {
            // Resolve and store any Note.Title entity passed from LUIS.
            var title;
            var intent = args.intent;
            var entity = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');
            if (entity) {
                // Verify that the title is in our set of notes.
                title = builder.EntityRecognizer.findBestMatch(session.userData.notes, entity.entity);
            }
            
            // Prompt for note name
            if (!title) {
                builder.Prompts.choice(session, 'Which note would you like to delete?', session.userData.notes);
            } else {
                next({ response: title });
            }
        } else {
            session.endDialog("No notes to delete.");
        }
    },
    function (session, results) {
        delete session.userData.notes[results.response.entity];        
        session.endDialog("Deleted the '%s' note.", results.response.entity);
    }
]).triggerAction({
    matches: 'Note.Delete'
}).cancelAction('cancelDeleteNote', "Ok - canceled note deletion.", {
    matches: /^(cancel|nevermind)/i
});

// Helper function to count the number of notes stored in session.userData.notes
function noteCount(notes) {
    
        var i = 0;
        for (var name in notes) {
            i++;
        }
        return i;
    }

    // Read note dialog
bot.dialog('ReadNote', [
    function (session, args, next) {
        if (noteCount(session.userData.notes) > 0) {
           
            // Resolve and store any Note.Title entity passed from LUIS.
            var title;
            var intent = args.intent;
            var entity = builder.EntityRecognizer.findEntity(intent.entities, 'Note.Title');
            if (entity) {
                // Verify it's in our set of notes.
                title = builder.EntityRecognizer.findBestMatch(session.userData.notes, entity.entity);
            }
            
            // Prompt for note name
            if (!title) {
                builder.Prompts.choice(session, 'Which note would you like to read?', session.userData.notes);
            } else {
                next({ response: title });
            }
        } else {
            session.endDialog("No notes to read.");
        }
    },
    function (session, results) {        
        session.endDialog("Here's the '%s' note: '%s'.", results.response.entity, session.userData.notes[results.response.entity].text);
    }
]).triggerAction({
    matches: 'Note.ReadAloud'
}).cancelAction('cancelReadNote', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('BuildPlan', [
    function (session, args, next) {
        // Resolve and store any Note.Title entity passed from LUIS.
        var intent = args.intent;
        var buildPlan = builder.EntityRecognizer.findEntity(intent.entities, 'Build.Plan');
        
        var buildBranch = builder.EntityRecognizer.findEntity(intent.entities, 'Build.Branch');

        var plan = session.dialogData.buildPlan = {
            name : buildPlan ? buildPlan.entity : null,
            branch : buildBranch ? buildBranch.entity : null,
        };
        
        // Prompt for title
        if (!plan.name) {
            builder.Prompts.text(session, 'Which plan would you like to build?');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var plan = session.dialogData.buildPlan;

        if(results.response) {
            plan.name = results.response;
        }
        // Prompt for title
        if (!plan.branch) {
            builder.Prompts.text(session, 'Which branch would you like to build?');
        } else {
            next();
        }
    },
    function (session, results, next) {
        var plan = session.dialogData.buildPlan;

        if(results.response) {
            plan.branch = results.response;
        }

        next();
    },
    function (session, results) {
        var plan = session.dialogData.buildPlan
        buildService.performBuild(plan.name,plan.branch);
        session.endDialog("building branch " + plan.branch + " of plan " + plan.name);
       
    }
]).triggerAction({
    matches: 'Build.Plan'
}).cancelAction('cancelBuildPlan', "Ok.", {
    matches: /^(cancel|nevermind)/i
});


bot.dialog('CommandWallnavigate', [
    function (session, args, next) {
        // Resolve and store any Note.Title entity passed from LUIS.
        var intent = args.intent;
        var mapToNavigate = builder.EntityRecognizer.findEntity(intent.entities, 'CommandWall.Map');

        
        // Prompt for title
        if (!mapToNavigate) {
            builder.Prompts.text(session, 'Which map would you like to navigate to?');
        } else {
            
            session.dialogData.mapToNavigate = mapToNavigate.entity;
            next();
        }
    },
    function (session, results, next) {

        if(results.response) {
            session.dialogData.mapToNavigate = results.response;
        }

        next();
    },
    function (session, results) {
        var mapToNavigate = session.dialogData.mapToNavigate

        session.endDialog("navigating to " + mapToNavigate);
       
    }
]).triggerAction({
    matches: 'CommandWall.Navigate'
}).cancelAction('cancelNavigated', "Ok.", {
    matches: /^(cancel|nevermind)/i
});