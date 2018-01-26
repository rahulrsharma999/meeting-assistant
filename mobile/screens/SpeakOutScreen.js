import React from 'react';
import { Text, Button, StyleSheet, View,Image, TextInput, } from 'react-native';
import { Constants, Speech } from 'expo';
import Touchable from 'react-native-platform-touchable'; // 1.1.1

import SpeakOut from './SpeakOut';

const EXAMPLES = [
  { language: 'en', text: 'Good Morning Sir! How can I help you?' }
];

class AmountControlButton extends React.Component {
  render() {
    return (
      <Touchable
        onPress={this.props.disabled ? null : this.props.onPress}
        hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}>
        <Text
          style={{
            color: this.props.disabled ? '#ccc' : 'blue',
            fontWeight: 'bold',
            paddingHorizontal: 5,
            fontSize: 18,
          }}>
          {this.props.title}
        </Text>
      </Touchable>
    );
  }
}

export default class TextToSpeechScreen extends React.Component {
  static navigationOptions = {
    title: 'Speech',
  };

  render() {
    return (

      <View style={styles.container}>
        <View style ={styles.header}>
        <Text style = {styles.headerText}> Wellcome to meeting assistant App! </Text>
        </View>
      <View style={{flex: 1, flexDirection: 'row', alignItems:'flex-end', margin: 20, height:10}}>
     <View>
        <TextInput
        //value={this.state.inputValue}
        //onChangeText={this._handleTextChange}
        style={{ width: 200, height: 44, padding: 8 }}
      />
      </View>

     <View style ={styles.spk}>
     <Image
        source={{ uri: 'https://s3.amazonaws.com/images.seroundtable.com/google-voice-search-1413374736.gif' }}
        style={{ height: 50, width: 60 }}
      />
     </View>
   </View>
         <View style  ={styles.spk}>
        <SpeakOut text='Welcome! I am here to help you manage your meetings.' />
        <SpeakOut text='Reminder! You have a meeting with John for Designing the Interactive Web class at 12:30 PM today.' />
        <SpeakOut text='Oops Sorry! Forgive me. I was just born yesterday.' />
        <SpeakOut text='I am just a reflection of my user.' />
        </View>

      </View>

    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 35,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginTop: 0,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    textAlign:'center',

  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: 20,
    marginBottom: 0,
    marginTop: 20,
  },
  spk:{
    flex: 1,
    paddingTop: 35,
      alignItems: 'flex-end',

  },
  header:{
    backgroundColor:'purple',
    alignItems:'center',
    justifyContent:'center',
    borderBottomWidth:10,
    borderBottomColor:'#eee',

  }

});
