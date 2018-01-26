import Expo from 'expo';
import React from 'react';
import { Button, StyleSheet, Text, View, Image, TouchableHighlight } from 'react-native';
import navigation, { StackNavigator } from 'react-navigation';

import AgendaScreen from './screens/AgendaScreen';
import DecideAction from './screens/DecideAction';
import SpeakOutScreen from './screens/SpeakOutScreen';

const RootNavigator = StackNavigator({
  DecideAction: {
    screen: DecideAction,
    navigationOptions: ({ navigation, screenProps }) => ({
      headerTitle: 'Meeting Assistant',
      headerTitleStyle: { color: 'white' },
      headerStyle: {backgroundColor: 'dimgray', marginTop: 24},
      headerRight:  <View style={{flexDirection: 'row'}}>
                      <TouchableHighlight onPress={() => navigation.navigate('Agenda')}>
                        <Image
                          source={require('./calendar.png')}
                          style={{width:40, height:40, marginRight:15, alignItems:'flex-start'}}
                        />
                      </TouchableHighlight>
                    </View>
    }),
  },
  Agenda: {
    screen: AgendaScreen,
    navigationOptions: ({ navigation, screenProps }) => ({
      headerTitle: 'Your Calendar',
      headerTitleStyle: { color: 'white' },
      headerStyle: {backgroundColor: 'dimgray', marginTop: 24},
    }),
  }
});

class App extends React.Component {
  render() {
    return <RootNavigator screenProps={this.props} style={{backgroundColor: 'gray'}} />
  }
}

Expo.registerRootComponent(App);
