import {StackNavigator } from 'react-navigation';
import Expo from 'expo';
import CalendarsScreen from './calendars';
import AgendaScreen from './agenda';
import CalendarsList from './calendarsList';
import React, {Component} from 'react';
import {
  Button,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const MenuScreen = ({navigation}) => (
      <View>
        <TouchableOpacity style={styles.menu} onPress={() => navigation.navigate('CalendarsScreen')}>
          <Text style={styles.menuText}>Calendars</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menu} onPress={() => navigation.navigate('CalendarsList')}>
          <Text style={styles.menuText}>Calendar List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menu} onPress={() => navigation.navigate('AgendaScreen')}>
          <Text style={styles.menuText}>Agenda</Text>
        </TouchableOpacity>
      </View>
    );

const RootNavigator = StackNavigator({
    MenuScreen: {screen: MenuScreen,},
    CalendarsScreen: {screen: CalendarsScreen,},
    AgendaScreen: {screen: AgendaScreen,},
    CalendarsList: {screen: CalendarsList,}
});

const styles = StyleSheet.create({
  menu: {
    height: 50,
    justifyContent: 'center',
    paddingLeft: 15,
    borderBottomWidth: 1
  },
  menuText: {
    fontSize: 18
  }
});

Expo.registerRootComponent(RootNavigator);
