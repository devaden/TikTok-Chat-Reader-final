require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const getCollectionByIdHook = require("./hooks/getCollectionByIdHook")
const addCollectionItemHook = require("./hooks/addCollectionItemHook");
const GetCollectionHook = require('./hooks/GetCollectionHook');
const getCollectionItemByIdOnSubscriptionHook = require('./hooks/getCollectionItemByIdOnSubscriptionHook');


const app = express();
const httpServer = createServer(app);

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

var activeQuestion = {} 
const setActiveQuestion = (data)=>{
    activeQuestion = data
}
getCollectionItemByIdOnSubscriptionHook("activeQuestion","active",setActiveQuestion)



io.on('connection', (socket) => {
    let tiktokConnectionWrapper;


    socket.on('setUniqueId', (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
        } else {
            options = {};
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
        }

        // // Check if rate limit exceeded
        // if (process.env.ENABLE_RATE_LIMIT) {
        //     socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
        //     return;
        // }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Redirect message events
        // tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        // tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        tiktokConnectionWrapper.connection.on('chat',async  msg => {   
            socket.emit('chat',msg)
            const question = await activeQuestion
            

            if(question.answer.toLowerCase() === msg.comment.toLowerCase()) {
                GetCollectionHook("answerUserList").then(x=>{
                    const result =  x.filter(x=>x.ref == (question.answer+question.title)) || []
                    console.log(result[0])

                    if(!result[0]) {
                        addCollectionItemHook("answerUserList",{
                            username:"@"+msg.uniqueId,
                            challengeId:question.challengeId,
                            ref:question.answer+question.title,
                            score:question.score,
                            answer:question.answer,
                            questionId:question.questionId
                        })
                    }  
                })
            }            
        });
        // tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        // tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        // tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        // tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        // tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        // tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        // tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        // tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 5000)

// Serve frontend files
app.use(express.static('public'));

// Start http listener
const port = process.env.PORT || 8081;
httpServer.listen(port);