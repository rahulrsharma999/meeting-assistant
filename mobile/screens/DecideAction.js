import React from 'react';
import { Text, TextInput, Button, StyleSheet, View, Image, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import Speech from 'expo';
import KeyboardSpacer from 'react-native-keyboard-spacer';
import SpeakOut from './SpeakOut';

import config from '../config';
const window = Dimensions.get('window');
const deviceWidth = Math.floor(window.width);
const deviceHeight = Math.floor(window.height);
const monthNames = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

function getDateNumber(date){ //date is in format 'Dec 10, 2017'
  let mthName = date.split(' ')[0];
  let mth = 0;
  for(i=0;i<monthNames.length;i++){
    if(mthName == monthNames[i]){
      mth = i;
      break;
    }
  }
  day = date.split(' ')[1].split(',')[0];
  day = ('0'+day).substr(-2);
  mth = ('0'+(mth+1)).substr(-2);
  year = date.split(' ')[2];

  return parseInt(year+mth+day);
}

function getDateFromDateNumber(dateNumber){
  let x = dateNumber;
  let date = x%100;
  x = (x - x%100)/100;
  let mth = (x%100) - 1;
  x = (x - x%100)/100;
  let yr = x;

  let dateStr = monthNames[mth]+' '+date+', '+yr;
  return dateStr;
}

function get24HourTime(time){ //time in format 10:15 PM
  var hours = Number(time.match(/^(\d+)/)[1]);
  var minutes = Number(time.match(/:(\d+)/)[1]);
  var AMPM = time.match(/\s(.*)$/)[1];
  if(AMPM == "PM" && hours<12) hours = hours+12;
  if(AMPM == "AM" && hours==12) hours = hours-12;
  var sHours = hours.toString();
  var sMinutes = minutes.toString();
  if(hours<10) sHours = "0" + sHours;
  if(minutes<10) sMinutes = "0" + sMinutes;
  return (sHours + "" + sMinutes);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

const timerTimeout = 60000;

export default class DecideAction extends React.Component {
  constructor(props){
    super(props);

    this.makeDecision = this.makeDecision.bind(this);
    this.createMeeting = this.createMeeting.bind(this);
    this.deleteMeeting = this.deleteMeeting.bind(this);
    this.getNextMeeting = this.getNextMeeting.bind(this);
    this.updateUserText = this.updateUserText.bind(this);
    this.notifyMeeting = this.notifyMeeting.bind(this);
    this.getResponse = this.getResponse.bind(this);
    this.getAllMeetingsData = this.getAllMeetingsData.bind(this);
    this.test = this.test.bind(this);
    this.parseDataFromDateString = this.parseDataFromDateString.bind(this);
    this.parseTimeFromTimeString = this.parseTimeFromTimeString.bind(this);
    this.checkTodayMeetingForNotification = this.checkTodayMeetingForNotification.bind(this);
  }

  state = {
    response: '',
    currAction: '',
    agenda: '',
    date: '',
    time: ''
  };

  userText : ''
  userContent = <UserMessage text='Hi' />
  content = <SpeakOut text='Welcome! I am here to help you manage your meetings.' />

  meetings = [];

  componentDidMount() {
    var data = {};
    var myRequest = new Request(`${config.API_BASE}/api/db/test`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(res => res.json())
    .then(json => {
      //console.log('JSON full: ' + JSON.stringify(json));
      if(json != null && json.success == 'success'){
        this.getAllMeetingsData();
      }
      else{
        let resp = 'Oops! I am unable to connect to the server. Please check your network connection and restart the app.';
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});
      }

    })
    .catch(error => {
      let resp = 'Oops! There was an error in connecting to the server. Please check your network connection and restart the app.';
      this.content = <SpeakOut text={resp} />
      this.setState({response: resp});
    });

  }

  getAllMeetingsData(){
    let deviceID = Expo.Constants.deviceId;
    console.log("Device ID : "+deviceID+", Width : "+deviceWidth+", Height : "+deviceHeight);

    var data = {};
    data.userName = Expo.Constants.deviceId;
    var myRequest = new Request(`${config.API_BASE}/api/db/meetings`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(res => res.json())
    .then(json => {
      //console.log('JSON full: ' + JSON.stringify(json));

      results = json.meetings;
      for(i=0;i<results.length;i++){
        let date = results[i].date;
        let timeNumber = parseInt(get24HourTime(results[i].time));

        if(this.meetings[date] == undefined){
          this.meetings[date] = [];
        }
        if(this.meetings[date][timeNumber] == undefined){
          this.meetings[date][timeNumber] = {};
        }

        this.meetings[date][timeNumber] = {'time':results[i].time, 'agenda':results[i].agenda};
      }

      //console.log('Timer Mounted!')
      setTimeout(() => this.notifyMeeting(), timerTimeout);

    })
    .catch(error => {
      console.log('meetings error!' + error);
    });
  }

  render() {
    this.userText = '';
    return (
      <Image source={require('../images/background.jpg')} style={styles.container}>
        <View style={styles.header}>
          <Image source={require('../images/girl.png')} />
        </View>

        <View style={styles.leftMessage}>
          <Image source={require('../images/user.png')} style={{width:30, height:30, marginBottom:5 }} />
          {this.userContent}
        </View>

        <View style={styles.rightMessage}>
          <Image source={require('../images/girl-small.png')} style={{width:30, height:30, marginBottom:5 }} />
          {this.content}
        </View>

        <View style={styles.userInput}>
          <UserInput
            userText={this.userText}
            onUpdateUserText={this.updateUserText}
            makeDecision={this.makeDecision}
          />
        </View>
      </Image>
    );
  }

  makeDecision(){
    var usrTxt = this.userText;
    this.userText = '';
    var action = this.state.currAction;

    if(usrTxt.includes('Stop') || usrTxt.includes('stop') || usrTxt.includes('STOP')){
      var respMsg = 'Ok.'
      this.userContent = <UserMessage text={usrTxt} />
      this.content = <SpeakOut text={respMsg} />
      this.setState({currAction: '', agenda: '', date: '', response: respMsg, time: ''});
    }

    //check if some converation is in progress
    else if(action != ''){
      //create meeting conversations
      if(action == 'agenda'){
        let currAgenda = usrTxt;
        this.userContent = <UserMessage text={usrTxt} />
        this.content = <SpeakOut text='What is the date of the meeting?' />
        this.setState({currAction: 'date', agenda: currAgenda, response: 'What is the date of the meeting?'});
      }
      else if(action == 'date'){
        let currDateStr = usrTxt;
        this.userContent = <UserMessage text={usrTxt} />
        let onSuccessAction = 'time';
        let onSuccessResponse = 'What is the time of the meeting?';
        let onFailureResponse = 'I did not understand the date of the meeting. Could you please tell the date again?'
        this.parseDataFromDateString(currDateStr, onSuccessAction, onSuccessResponse, onFailureResponse);
      }
      else if(action == 'time'){
        let currTimeStr = usrTxt;
        this.userContent = <UserMessage text={usrTxt} />

        let finalTime = this.parseTimeFromTimeString(currTimeStr);
        if(finalTime == ''){
          this.content = <SpeakOut text='I did not understand the time of the meeting. Could you please tell the time again?' />
          this.setState({currAction: 'time', response: 'I did not understand the date of the meeting.'});
        }
        else{
          let dateNumber = getDateNumber(this.state.date);
          let timeNumber = parseInt(get24HourTime(finalTime));
          if( (this.meetings[dateNumber] != undefined) && (this.meetings[dateNumber][timeNumber] != undefined) ){
            let resp = 'Oops! You already have a meeting scheduled for '+this.meetings[dateNumber][timeNumber].agenda+' at this time. Should I replace it with the new meeting?';
            this.content = <SpeakOut text={resp} />
            this.setState({currAction: 'replaceOld', time: finalTime, response: resp});
          }
          else{
            this.createMeeting(this.state.agenda, this.state.date, finalTime);
          }
        }
      }
      else if(action == 'replaceOld'){
        if(usrTxt.includes('No') || usrTxt.includes('no')){
          this.content = <SpeakOut text='Ok. I did not replace the old meeting. What is the time for the new meeting?' />
          this.setState({currAction: 'time', response: 'Ok. I did not replace the old meeting. What is the time for the new meeting?'});
        }
        else if(usrTxt.includes('Yes') || usrTxt.includes('yes') || usrTxt.includes('Sure') || usrTxt.includes('sure')){
          this.updateMeeting(this.state.agenda, this.state.date, this.state.time);
        }
        else{
          this.content = <SpeakOut text='Sorry, I did not get that! You can say Yes to replace the old meeting or No to retain the old meeting and select a new time for your new meeting.' />
          this.setState({currAction: 'replaceOld', response: 'I did not understand the date of the meeting.'});
        }
      }

      //delete meeting conversations
      else if(action == 'deleteDate'){
        let currDateStr = usrTxt;
        this.userContent = <UserMessage text={usrTxt} />

        let onSuccessAction = 'deleteTime';
        let onSuccessResponse = 'What is the time of the meeting?';
        let onFailureResponse = 'I did not understand the date of the meeting to delete. Could you please tell the date again?'
        this.parseDataFromDateString(currDateStr, onSuccessAction, onSuccessResponse, onFailureResponse);
      }
      else if(action == 'deleteTime'){
        let currTimeStr = usrTxt;
        this.userContent = <UserMessage text={usrTxt} />

        let finalTime = this.parseTimeFromTimeString(currTimeStr);
        if(finalTime == ''){
          this.content = <SpeakOut text='I did not understand the time of the meeting to delete. Could you please tell the time again?' />
          this.setState({currAction: 'deleteTime', response: 'I did not understand the date of the meeting.'});
        }
        else{
          this.deleteMeeting(this.state.date, finalTime);
        }
      }
    }

    //check for new conversation
    else{
      if(usrTxt.includes('meeting') && (usrTxt.includes('create') || usrTxt.includes('add') || usrTxt.includes('schedule'))){
        this.userContent = <UserMessage text={usrTxt} />
        this.test('agenda', 'OK. What is the agenda of the meeting?');
      }
      else if(usrTxt.includes('meeting') && (usrTxt.includes('delete') || usrTxt.includes('remove') || usrTxt.includes('cancel'))){
        this.userContent = <UserMessage text={usrTxt} />
        this.test('deleteDate', 'OK. Deleting a meeting for you. What is the date of that meeting?');
      }
      else if(usrTxt.includes('meeting') && (usrTxt.includes('latest') || usrTxt.includes('next')) ){
        let meeting = this.getNextMeeting();
        if(meeting.date == undefined){
          todaymeetingsMsg = 'I do not have any upcoming meetings for you.'
          this.userContent = <UserMessage text={usrTxt} />
          this.content = <SpeakOut text={todaymeetingsMsg} />
          this.setState({response: "No upcoming meeting."});
        }
        else{
          todaymeetingsMsg = 'Your next meeting is '+meeting.agenda+' on '+meeting.date+' at '+meeting.time;
          this.userContent = <UserMessage text={usrTxt} />
          this.content = <SpeakOut text={todaymeetingsMsg} />
          this.setState({response: {todaymeetingsMsg} });
        }
      }
      else{
        this.userContent = <UserMessage text={usrTxt} />
        this.getResponse(usrTxt);
      }
    }
  }

  parseDataFromDateString(currDateStr, onSuccessAction, onSuccessResponse, onFailureResponse){
    let usrDateStrings = currDateStr.split(' ');
    let year=0;
    let day=0;
    let month=0;

    if( (usrDateStrings == ('today')) || (usrDateStrings == ('Today')) || (usrDateStrings == ('TODAY')) ){
      let dt = new Date();
      year = dt.getFullYear();
      month = ('0'+(dt.getMonth()+1)).substr(-2);
      day = ('0'+dt.getDate()).substr(-2);
    }
    else if( (usrDateStrings == ('tomorrow')) || (usrDateStrings == ('Tomorrow')) || (usrDateStrings == ('Tomorrow')) ){
      let todayDt = new Date();
      let dt = new Date();
      dt.setDate(todayDt.getDate()+1);
      year = dt.getFullYear();
      month = ('0'+(dt.getMonth()+1)).substr(-2);
      day = ('0'+dt.getDate()).substr(-2);
    }
    else{
      for(i=0;i<usrDateStrings.length;i++){
        let str = usrDateStrings[i];
        if(str.length == 1 && !isNaN(parseInt(str)) ){
          temp = parseInt(str);
          day = ('0'+temp).substr(-2);
        }
        else if(str.length == 2 && !isNaN(parseInt(str)) ){
          temp = parseInt(str);
          day = ('0'+temp).substr(-2);
        }
        else if(str.length == 3 && !isNaN(parseInt(str.substring(0,1))) && (str.substring(1).includes('st') || str.substring(1).includes('nd') || str.substring(1).includes('rd') || str.substring(1).includes('th'))){
          temp = parseInt(str.substring(0,1));
          day = ('0'+temp).substr(-2);
        }
        else if(str.length == 4 && !isNaN(parseInt(str.substring(0,2))) && (str.substring(2).includes('st') || str.substring(2).includes('nd') || str.substring(2).includes('rd') || str.substring(2).includes('th'))){
          day = str.substring(0,2);
        }
        else if(str.length == 4 && !isNaN(parseInt(str)) && parseInt(str) > 1000 ){
          year = str;
        }
        else{
          for(j=0;j<monthNames.length;j++){
            if(str.includes(monthNames[j])){
              month = ('0'+(j+1)).substr(-2);
              break;
            }
          }
        }
      }
    }

    if(year == 0 || month == 0 || day == 0){
      let resp = onFailureResponse
      this.content = <SpeakOut text={resp} />
      this.setState({response: resp});
    }
    else{
      let resp = onSuccessResponse
      let speaking_date = monthNames[parseInt(month)-1]+' '+day+', '+year
      this.content = <SpeakOut text={resp} />
      this.setState({currAction: onSuccessAction, date: speaking_date, response: resp});
    }
  }

  parseTimeFromTimeString(currTimeStr){
    let usrTimeStrings = currTimeStr.split(' ');
    let timestr = 0;
    let ampm = 0;

    for(i=0;i<usrTimeStrings.length;i++){
      let str = usrTimeStrings[i];
      if(str.includes('am') || str.includes('AM') || str.includes('A.M.') || str.includes('a.m.')){
        ampm = 'AM'
      }
      else if(str.includes('pm') || str.includes('PM') || str.includes('P.M.')  || str.includes('p.m.')){
        ampm = 'PM'
      }
      else if(str.includes(':') && str.length==5 ){
        timestr = str;
      }
      else if(str.includes(':') && str.length==4 && !str.includes('::') && !str.includes(':::') && !str.includes('::::')){
        if(parseInt(str.split(':')[0])<10 && parseInt(str.split(':')[1])>9){
          let hh = parseInt(str.split(':')[0]);
          hh = ('0'+(hh)).substr(-2);
          timestr = hh+':'+parseInt(str.split(':')[1]);
        }
        else if(parseInt(str.split(':')[0])>9 && parseInt(str.split(':')[1])<9){
          let mm = parseInt(str.split(':')[1]);
          mm = ('0'+(mm)).substr(-2);
          timestr = parseInt(str.split(':')[0])+':'+mm;
        }
      }
      else if(str.includes(':') && str.length==3 && !str.includes('::') && !str.includes(':::') && !isNaN(parseInt(str.split(':')[0])) && !isNaN(parseInt(str.split(':')[1])) ){
        let hh = parseInt(str.split(':')[0]);
        let mm = parseInt(str.split(':')[1]);
        hh = ('0'+(hh)).substr(-2);
        mm = ('0'+(mm)).substr(-2);
        timestr = hh+':'+mm;
      }
      else if(!str.includes(':') && str.length==2 && !isNaN(parseInt(str))){
        timestr = parseInt(str)+':00';
      }
      else if(!str.includes(':') && str.length==1 && !isNaN(parseInt(str))){
        timestr = '0'+parseInt(str)+':00';
      }
    }

    if(ampm==0 || timestr == 0){
      let finalTime = '';
      return finalTime;
    }
    else{
      let finalTime = timestr + ' '+ ampm;
      return finalTime;
    }
  }

  test(onSuccessAction, onSuccessResponse){
    var data = {};
    var myRequest = new Request(`${config.API_BASE}/api/db/test`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(res => res.json())
    .then(json => {
      console.log('Test network connection result : ' + JSON.stringify(json));
      if(json != null && json.success == 'success'){
        let resp = onSuccessResponse
        this.content = <SpeakOut text={resp} />
        this.setState({currAction: onSuccessAction, response: resp});
      }
      else{
        let resp = 'Oops! I am unable to connect to the server. Please check your network connection.';
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});
      }

    })
    .catch(error => {
      let resp = 'Oops! There was an error in connecting to the server. Please check your network connection.';
      this.content = <SpeakOut text={resp} />
      this.setState({response: resp});
    });
  }

  getResponse(usrTxt){
    var data = {};
    data.usrTxt = usrTxt;

    var myRequest = new Request(`${config.API_BASE}/api/db/getResponse`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then(res => res.json())
      .then(json => {

        //console.log('JSON full: ' + JSON.stringify(json));
        let resp = json.result;

        if(resp == '' || resp == null || resp == undefined){
          resp = ((Math.floor(Math.random()*(2))+1)==1)?"I didn't quite understand that.":"Sorry! I did not get that."
        }
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});

      })
      .catch(error => {
        console.log("error on call to server for getting response for user text...");
        let resp = ((Math.floor(Math.random()*(2))+1)==1)?"I didn't quite understand that.":"Sorry! I did not get that."
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});
      });
  }

  createMeeting(agenda, date, time){
    let dateNumber = getDateNumber(date);
    //console.log('dateNumber : '+dateNumber);
    if(this.meetings[dateNumber] == undefined){
      this.meetings[dateNumber] = [];
    }

    //saving to database
    var data = {};
    data.date = dateNumber;
    data.time = time;
    data.agenda = agenda;
    data.userName = Expo.Constants.deviceId;

    var myRequest = new Request(`${config.API_BASE}/api/db/createMeeting`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then(res => res.json())
      .then(json => {
        //console.log('Create meeting response : ' + JSON.stringify(json));

        //adding to local array
        let timeNumber = parseInt(get24HourTime(time))
        if(this.meetings[dateNumber][timeNumber] == undefined){
          this.meetings[dateNumber][timeNumber] = {};
        }
        this.meetings[dateNumber][timeNumber] = {'time':time, 'agenda':agenda};
        //console.log("Added meeting : "+JSON.stringify(this.meetings[dateNumber]));

        //success message
        var meetingMsg = 'Great! Your meeting for '+agenda+' on '+date+' at '+time+' has been scheduled...'
        this.content = <SpeakOut text={meetingMsg} />
        this.setState({currAction: '', agenda: '', date: '', response: meetingMsg, time: ''});

      })
      .catch(error => {
        console.log('meeting create error!' + error);
        let resp = 'Oops! There was an error in connecting to the server. Please check your network connection.';
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});
      });
  }

  updateMeeting(agenda, date, time){
    let dateNumber = getDateNumber(date);
    //console.log('dateNumber : '+dateNumber);

    //saving to database
    var data = {};
    data.date = dateNumber;
    data.time = time;
    data.agenda = agenda;
    data.userName = Expo.Constants.deviceId;

    var myRequest = new Request(`${config.API_BASE}/api/db/updateMeeting`, {
      method: 'POST',
      headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
      body: JSON.stringify(data)
    });

    fetch(myRequest)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response;
      })
      .then(res => res.json())
      .then(json => {
        //console.log('Update meeting response : ' + JSON.stringify(json));

        //adding to local array
        let timeNumber = parseInt(get24HourTime(time))
        this.meetings[dateNumber][timeNumber] = {'time':time, 'agenda':agenda};
        //console.log("Updated meeting : "+JSON.stringify(this.meetings[dateNumber]));

        //success message
        var meetingMsg = 'Great! Your new meeting for '+agenda+' on '+date+' at '+time+' has been scheduled...'
        this.content = <SpeakOut text={meetingMsg} />
        this.setState({currAction: '', agenda: '', date: '', response: meetingMsg, time: ''});

      })
      .catch(error => {
        console.log('meeting update error!' + error);
        let resp = 'Oops! There was an error in connecting to the server. Please check your network connection.';
        this.content = <SpeakOut text={resp} />
        this.setState({response: resp});
      });
  }

  deleteMeeting(date, time){
    let dateNumber = getDateNumber(date);
    let timeNumber = parseInt(get24HourTime(time))
    //console.log('dateNumber : '+dateNumber);
    //console.log('timeNumber : '+timeNumber);

    let meetingDateInfo = this.meetings[dateNumber][timeNumber];
    if(meetingDateInfo != undefined){
      //deleting from database
      var data = {};
      data.date = dateNumber;
      data.time = time;
      data.userName = Expo.Constants.deviceId;

      var myRequest = new Request(`${config.API_BASE}/api/db/deleteMeeting`, {
        method: 'POST',
        headers: Object.assign({'Accept': 'application/json','Content-Type': 'application/json'}),
        body: JSON.stringify(data)
      });

      fetch(myRequest)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response;
        })
        .then(res => res.json())
        .then(json => {
          //console.log('Delete meeting response : ' + JSON.stringify(json));

          //console.log("Deleting from local array : "+JSON.stringify(this.meetings[dateNumber][timeNumber]));
          delete this.meetings[dateNumber][timeNumber];
          if( isEmpty(this.meetings[dateNumber]) ){
            delete this.meetings[dateNumber];
          }

          var meetingMsg = 'Your meeting on '+this.state.date+' at '+time+' has been deleted...'
          this.content = <SpeakOut text={meetingMsg} />
          this.setState({currAction: '', agenda: '', date: '', response: meetingMsg, time: ''});
        })
        .catch(error => {
          console.log('meeting delete error!' + error);
          let resp = 'Oops! There was an error in connecting to the server. Please check your network connection.';
          this.content = <SpeakOut text={resp} />
          this.setState({response: resp});
        });
    }
    else{
      var meetingMsg = 'There is no meeting scheduled on '+this.state.date+' at '+time+'.'
      this.content = <SpeakOut text={meetingMsg} />
      this.setState({currAction: '', agenda: '', date: '', response: meetingMsg});
    }
  }

  updateUserText = (text) => {
    this.userText = text;
  }

  getNextMeeting(){
    currDate = new Date();
    let currDateNumber = parseInt(currDate.getFullYear()
                        +( '0' + (currDate.getMonth()+1) ).substr(-2)
                        +( '0' + (currDate.getDate()) ).substr(-2) );
    let currTimeNumber = parseInt( ( '0' + (currDate.getHours()) ).substr(-2)
                        +( '0' + (currDate.getMinutes()) ).substr(-2) );
    //console.log('inside getNextMeeting() :: current date : '+currDateNumber+', time : '+currTimeNumber);

    for(tempDate in this.meetings){
      if(tempDate == currDateNumber){
        for(tempTime in this.meetings[tempDate]){
          if(tempTime >= currTimeNumber){
            let dateStr = getDateFromDateNumber(tempDate);
            return {'date': dateStr, 'time': this.meetings[tempDate][tempTime].time, 'agenda': this.meetings[tempDate][tempTime].agenda};
          }
        }
      }
      else if(tempDate > currDateNumber){
        //return first meeting
        for(tempTime in this.meetings[tempDate]){
          let dateStr = getDateFromDateNumber(tempDate);
          return {'date': dateStr, 'time': this.meetings[tempDate][tempTime].time, 'agenda': this.meetings[tempDate][tempTime].agenda};
        }
      }
    }
    return {};
  }

  checkTodayMeetingForNotification(){
    currDate = new Date();
    let currDateNumber = parseInt(currDate.getFullYear()
                        +( '0' + (currDate.getMonth()+1) ).substr(-2)
                        +( '0' + (currDate.getDate()) ).substr(-2) );
    let currTimeNumber = parseInt( ( '0' + (currDate.getHours()) ).substr(-2)
                        +( '0' + (currDate.getMinutes()) ).substr(-2) );
    //console.log('inside checkTodayMeetingForNotification() :: current date : '+currDateNumber+', time : '+currTimeNumber);

    if( (this.meetings[currDateNumber] != undefined) && (this.meetings[currDateNumber][currTimeNumber] != undefined) ){
      let dateStr = getDateFromDateNumber(currDateNumber);
      return {'date': dateStr, 'time': this.meetings[currDateNumber][currTimeNumber].time, 'agenda': this.meetings[currDateNumber][currTimeNumber].agenda};
    }
    return {};
  }

  notifyMeeting(){
    let meeting = this.checkTodayMeetingForNotification();

    if(meeting != undefined && meeting.date != undefined){
      todaymeetingsMsg = 'Gentle Reminder! Your have a meeting today for '+meeting.agenda+' at '+meeting.time;
      this.content = <SpeakOut text={todaymeetingsMsg} />
      this.setState({response: {todaymeetingsMsg} });
    }

    //console.log('Timer Mounted!')
    setTimeout(() => this.notifyMeeting(), timerTimeout)
  }
}

class UserMessage extends React.Component {
  constructor(props){
    super(props);
    this.noAction = this.noAction.bind(this);
  }

  render() {
    return (
      <Button
        color='gray'
        title={this.props.text}
        onPress={this.noAction}
      />
    );
  }

  noAction(){}
}

class UserInput extends React.Component {
  state = {
    contentUpdated: 0
  };

  constructor(props) {
    super(props);
    this.performAction = this.performAction.bind(this);
    this.state = {
      content: '',
      contentUpdated: 0
    };
  }
  render() {
    return (
      <View>
        <KeyboardAvoidingView keyboardVerticalOffset={630} behavior={'padding'}>
          <TextInput
            style={{ width: (deviceWidth-40), height: 44, padding: 8 }}
            placeholder="Type your message here!"
            value={this.state.content}
            onChangeText={(text) => {
              this.props.onUpdateUserText(text);
              this.setState({content: text});
            }}
          />

          <Button
            onPress={this.performAction}
            title='OK'
          />
        </KeyboardAvoidingView>
      </View>
    );
  }

  performAction(){
    this.props.makeDecision();
    this.setState({content: ''});
  }
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover', // or 'stretch'
  },
  container: {
    flex: 1,
    paddingTop: 0,
    resizeMode: 'cover', // or 'stretch'
    alignSelf: 'stretch',
    width: null,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 0,
    marginBottom: 5,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 0
  },
  leftMessage:{
    flex: 1,
    alignItems: 'flex-start',
    marginBottom:10,
    marginLeft:30,
    marginRight:100,
  },
  rightMessage:{
    flex: 1,
    alignItems: 'flex-end',
    marginBottom:25,
    marginLeft:100,
    marginRight:30,
  },
  header:{
    marginTop:20,
    marginBottom:0,
    marginLeft:30,
    marginRight:0,
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
  },
  userInput:{
    flex: 1,
    flexDirection: 'row',
    alignItems:'flex-end',
    margin: 20,
    height:10
  },
  spaced: {
    marginTop: 20,
  }
});
