import React from 'react';
import styles from './style.css';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Search from '../../common/components/Search';

injectTapEventPlugin();

export default class SearchPage extends React.Component {
  render() {
    return (
      <div>
        <Search/>
      </div>
    );
  }
}
