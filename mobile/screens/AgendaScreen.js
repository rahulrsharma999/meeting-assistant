import React, { Component } from 'react';
import {
  Text,
  View,
  StyleSheet
} from 'react-native';
import {Agenda} from 'react-native-calendars';
import config from '../config'

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

export default class AgendaScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: {},
      month: 10
    };
  }

  render() {
    return (
      <Agenda style={styles.container}
        items={this.state.items}
        loadItemsForMonth={this.loadItemsForMonth.bind(this)}
        selected={new Date()}
        renderItem={this.renderItem.bind(this)}
        renderEmptyDate={this.renderEmptyDate.bind(this)}
        rowHasChanged={this.rowHasChanged.bind(this)}
      />
    );
  }

  loadItemsForMonth(day) {
    //console.log("inside loadItems :: day : "+JSON.stringify(day));
    let currYear = '' + day.year;
    let currMonth = ('0' + day.month).substr(-2);
    let currDay = ('0' + day.day).substr(-2);

    var data = {
      year: currYear,
      month: currMonth,
      userName: Expo.Constants.deviceId
    };
    let myRequest = new Request(`${config.API_BASE}/api/db/monthMeetings`, {
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
        //console.log('Month Meeting response : ' + JSON.stringify(json));

        let currItems = this.state.items;
        let currMonthItemsTimewise = [];
        for(i=1;i<=31;i++){
          let tempDate = currYear + '-' + currMonth + '-' + ('0' + i).substr(-2);
          currItems[tempDate] = [];
          currMonthItemsTimewise[tempDate] = [];
        }

        let monthMeetings = json.monthMeetings;
        for (j=0; j<monthMeetings.length; j++){
          let date = ''+ monthMeetings[j].date;
          let tempDate = date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8);
          let timeNumber = parseInt(get24HourTime(monthMeetings[j].time));
          currMonthItemsTimewise[tempDate][timeNumber] = {time: monthMeetings[j].time, name: monthMeetings[j].agenda};
        }

        for(tempDayMeetings in currMonthItemsTimewise){
          for(tempDayTimeMeetings in currMonthItemsTimewise[tempDayMeetings]){
            currItems[tempDayMeetings].push(currMonthItemsTimewise[tempDayMeetings][tempDayTimeMeetings]);
          }
        }

        //console.log('Final currItems : ' + JSON.stringify(currItems));
        this.setState({
          items: currItems
        })
      })
      .catch(error => {
        console.log('monthMeetings error!' + error);
      });
  }

  renderItem(item) {
    return (
      <View style={styles.item}>
        <Text >{item.time}</Text>
        <Text style={styles.name}>{item.name}</Text>
      </View>
    );
  }

  renderEmptyDate() {
    return (
      <View style={styles.item}>
        <Text ></Text>
        <Text style={styles.name}></Text>
      </View>
    );
  }

  rowHasChanged(r1, r2) {
    return r1.name !== r2.name;
  }

  timeToString(time) {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    alignSelf: 'stretch',
    width: null,
  },
  item: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
    height: 100
  },
  name:{
    fontSize: 22,
    paddingTop: 10,
    color: 'indigo',
    fontWeight: 'bold'
  },
  emptyDate: {
    height: 15,
    flex:1,
    paddingTop: 30
  }
});
