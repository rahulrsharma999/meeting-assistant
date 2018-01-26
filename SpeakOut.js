import React from 'react';
import { Text, Button, StyleSheet, View } from 'react-native';
import { Speech } from 'expo';

export default class SpeakOut extends React.Component {
  state = {
    pitch: 1.30,
    rate: 1.0,
  };
  selectedExample = { language: 'en', text: 'Hi There!' };

  componentWillMount(){
    console.log('willmount')
    textToSpeak = this.props.text;
    this.selectedExample = { language: 'en', text: textToSpeak}
  }

  render() {
    console.log('rendering...')
    textToSpeak = this.props.text;
    this.selectedExample = { language: 'en', text: textToSpeak}

    //speak when loaded
    const start = () => {};
    const complete = () => {};

    Speech.speak(this.selectedExample.text, {
      language: this.selectedExample.language,
      pitch: this.state.pitch,
      rate: this.state.rate,
      onStart: start,
      onDone: complete,
      onStopped: complete,
      onError: complete,
    });

    return (
      <Button
        color='seagreen'
        onPress={this._speak}
        title={this.props.text}
      />
    );
  }

  _speak = () => {
    const start = () => {};
    const complete = () => {};

    Speech.speak(this.selectedExample.text, {
      language: this.selectedExample.language,
      pitch: this.state.pitch,
      rate: this.state.rate,
      onStart: start,
      onDone: complete,
      onStopped: complete,
      onError: complete,
    });
  };

  _stop = () => {
    Speech.stop();
  };
}
