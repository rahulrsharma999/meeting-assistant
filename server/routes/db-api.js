var express = require('express');
var router = express.Router();

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
