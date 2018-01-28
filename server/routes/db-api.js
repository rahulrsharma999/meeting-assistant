var express = require('express');
var router = express.Router();
var Expo = require('expo-server-sdk');
var fs = require('fs');

var notifications = {};
loadNotificationsFromFile();

////////////////////////////////////////////////////////////////////////////////////
//PUSH Notifications
////////////////////////////////////////////////////////////////////////////////////

//loop forever sleeping for 10 minutes and checking for next notifications to send
setInterval(checkNotifications, 600000);

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function writeNotificationsToFile(){
  let notificationsdata = JSON.stringify(notifications);
  fs.writeFile("notifications.json", notificationsdata, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("Notifications backed up to file notifications.json");
  });
}

function loadNotificationsFromFile(){
  fs.readFile("notifications.json", 'utf8', function (err, data) {
    if (err) throw err;
    notifications = JSON.parse(data);
    console.log("Notifications loaded from file notifications.json");
  });
}

function checkNotifications(){
  let dt = new Date();
  let messages = [];

  console.log('Checking for notifications at : '+dt.toString());

  for(i=0;i<10;i++){  //check for next 10 minutes notifications
    let currDate = new Date(dt.getTime() + i * 60000)
    let currDateNumber = parseInt(currDate.getFullYear()
                        +( '0' + (currDate.getMonth()+1) ).substr(-2)
                        +( '0' + (currDate.getDate()) ).substr(-2) );
    let currTimeNumber = parseInt( ( '0' + (currDate.getHours()) ).substr(-2)
                        +( '0' + (currDate.getMinutes()) ).substr(-2) );

    if( (notifications[currDateNumber] != undefined) && (notifications[currDateNumber][currTimeNumber] != undefined) ){
      Array.prototype.push.apply(messages,notifications[currDateNumber][currTimeNumber]);
      delete notifications[currDateNumber][currTimeNumber];
    }

    if( isEmpty(notifications[currDateNumber]) ){
      delete notifications[currDateNumber];
    }
  }

  expoNotify(messages);
  writeNotificationsToFile();
}

function expoNotify(messages){
  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let expo = new Expo();
  let chunks = expo.chunkPushNotifications(messages);

  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        //console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}

router.post('/pushNotification', function(req, res, next) {
  let messages = [];
  let pushToken = req.body.token;

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
  }
  else{
    messages.push({
      to: pushToken,
      sound: 'default',
      body: req.body.message
    })
  }

  expoNotify(messages);
});

router.post('/addNotification', function(req, res, next) {
  // Create a new Expo SDK client
  let pushToken = req.body.token;

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
  }
  else{
    let notifyDateUTC = req.body.notifyDateTime;
    let dt = new Date();
    let localDateUTC = notifyDateUTC - (dt.getTimezoneOffset() * 60000);
    //to notify 10 minutes in advance
    let localNotifyDateUTC = localDateUTC - 600000;
    let localNotifyDate = new Date(localNotifyDateUTC);

    let notifyDateNumber = parseInt(localNotifyDate.getFullYear()
                        +( '0' + (localNotifyDate.getMonth()+1) ).substr(-2)
                        +( '0' + (localNotifyDate.getDate()) ).substr(-2) );
    let notifyTimeNumber = parseInt( ( '0' + (localNotifyDate.getHours()) ).substr(-2)
                        +( '0' + (localNotifyDate.getMinutes()) ).substr(-2) );

    if(notifications[notifyDateNumber] == undefined){
      notifications[notifyDateNumber] = {};
    }
    if(notifications[notifyDateNumber][notifyTimeNumber] == undefined){
      notifications[notifyDateNumber][notifyTimeNumber] = [];
    }

    notifications[notifyDateNumber][notifyTimeNumber].push({
      to: pushToken,
      sound: 'default',
      body: req.body.message
    })
  }
});
/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Test if connected to server
////////////////////////////////////////////////////////////////////////////////////

router.post('/test', function(req, res, next) {
  res.json({
    success: 'success'
  });
});

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Get Meetings
////////////////////////////////////////////////////////////////////////////////////

router.post('/meetings', function(req, res, next) {
  //console.log("Fetching all meetings...");
  var auth0_username_hash = req.body.userName.hashCode();
  //console.log("User Name received : "+req.body.userName);
  //console.log("User id : "+auth0_username_hash);

  req.db.collection('user_meeting').find(
    {
      "userId":auth0_username_hash
    }).toArray(
        function(err, results) {
          if (err) {
            next(err);
          }

          //console.log(results);

          res.json({
            'meetings': results
          });
        });
  });

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Get Meetings in a Month
////////////////////////////////////////////////////////////////////////////////////

router.post('/monthMeetings', function(req, res, next) {
  //console.log("Fetching all meetings in a month..");
  var auth0_username_hash = req.body.userName.hashCode();
  //console.log("User Name received : "+req.body.userName);
  //console.log("User id : "+auth0_username_hash);

  var year = req.body.year;
  var month = req.body.month;
  //console.log('year: ' + year + ', month:' + month);
  var fromDate = parseInt(year+''+month+''+'01');
  var toDate = parseInt(year+''+month+''+'31');

  req.db.collection('user_meeting').find(
    {
      "userId":auth0_username_hash
    }).toArray(
        function(err, results) {
          if (err) {
            next(err);
          }

          //console.log(results);
          var monthMeetings = [];

          for(i=0;i<results.length;i++){
            var date = results[i].date;
            if( (parseInt(date) >= fromDate) && (parseInt(date) <= toDate) ){
              //console.log('Pushing to monthMeetings: ');
              monthMeetings.push(results[i]);
            }
          }
          //console.log('monthMeetings: '  + JSON.stringify(monthMeetings[0]));
          res.json({
            'monthMeetings': monthMeetings
          });
        });
  });

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Create Meeting
////////////////////////////////////////////////////////////////////////////////////

router.post('/createMeeting', function(req, res) {
    //console.log("Creating meeting...");
    var auth0_username_hash = req.body.userName.hashCode();
    //console.log("User Name received : "+req.body.userName);
    //console.log("User id : "+auth0_username_hash);

    req.db.collection('user_meeting').insertOne(
      {
          "userId": auth0_username_hash,
          "date": req.body.date,
          "time": req.body.time,
          "agenda": req.body.agenda
      }
      , function(err, results) {
        if (err) {
          next(err);
        }

        //console.log("Create results: "+results);

        res.json({
          'status': 'success'
        });
      });
});

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Delete Meeting
////////////////////////////////////////////////////////////////////////////////////

router.post('/deleteMeeting', function(req, res, next) {
  //console.log("deleting meeting...");
  //console.log("date : "+req.body.date)
  //console.log("time : "+req.body.time)
  var auth0_username_hash = req.body.userName.hashCode();
  //console.log("User Name received : "+req.body.userName);
  //console.log("User id : "+auth0_username_hash);

  req.db.collection('user_meeting').deleteOne(
    {
      $and:
      [
        {
          "userId": auth0_username_hash
        },
        {
          "date": req.body.date
        },
        {
          "time": req.body.time
        }
      ]
    }
    , function(err, results) {
      if (err) {
      next(err);
    }

    //console.log("Delete results: "+results);
    if(results==null || results.deletedCount==0){
      //console.log("Nothing deleted from DB...");
      res.json({
        'status': 'Deleted 0 meetings'
      });
    }
    else{
      res.json({
        'status': 'success'
      });
    }
  });
});

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Update Meeting
////////////////////////////////////////////////////////////////////////////////////

router.post('/updateMeeting', function(req, res, next) {
  // console.log("updating meeting...");
  // console.log("date : "+req.body.date)
  // console.log("time : "+req.body.time)
  // console.log("agenda : "+req.body.agenda)
  var auth0_username_hash = req.body.userName.hashCode();
  // console.log("User Name received : "+req.body.userName);
  // console.log("User id : "+auth0_username_hash);

  req.db.collection('user_meeting').updateOne(
    {
      $and:
      [
        {
          "userId": auth0_username_hash
        },
        {
          "date": req.body.date
        },
        {
          "time": req.body.time
        }
      ]
    }
    ,{
      $set:
        {
          "agenda": req.body.agenda
        }
    }
    , function(err, results) {
      if (err) {
        next(err);
      }

      //console.log("Update results: "+results);
      res.json({
        'status': 'success'
      });
  });
});

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
//Get Response
////////////////////////////////////////////////////////////////////////////////////

function getResponsefromDB(resultArr, req, res){
  let resultstr = '';
  for(i=0;i<resultArr.length;i++){
    if(i==0){
      resultstr = resultstr + resultArr[i];
    }
    else{
      resultstr = resultstr + ',' + resultArr[i];
    }
  }

  if(resultstr == ''){
    res.json({'result': ''});
  }
  else{
    console.log("Checking response for keyids: "+resultstr);
    req.db.collection('user_response').findOne(
      {
          "keyids": resultstr
      }
      , function(err, results) {
        if (err) {
          next(err);
        }

        //console.log(results);

        if(results != null && results.response){
          res.json({'result': results.response});
        }
        else{
          let newResultArr = [];
          for(i=0;i<resultArr.length-1;i++){
            newResultArr.push(resultArr[i]);
          }
          getResponsefromDB(newResultArr, req, res);
        }
    });
  }
}

router.post('/getResponse', function(req, res) {
    //console.log("Getting response...");
    var usrTxt = req.body.usrTxt;
    //console.log("User Text : "+usrTxt);

    let userText = usrTxt.split(' ');
    let queryCond = [{"key": userText[0]}]
    for(i=1;i<userText.length;i++){
      queryCond.push({"key": userText[i]});
    }

    req.db.collection('user_keys').find(
      {
        $or: queryCond
      }, {keyid: 1}
    ).toArray(
          function(err, results) {
            if (err) {
              next(err);
            }

            //console.log(results);
            let resultArr = [];
            for(i=0;i<results.length;i++){
              resultArr.push(results[i].keyid);
            }
            resultArr.sort();
            getResponsefromDB(resultArr, req, res);
          });
    });

/////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

module.exports = router;
