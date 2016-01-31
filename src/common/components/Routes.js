import React from 'react';
import { Route, IndexRoute } from 'react-router';

import App from './App';
import SearchPage from '../../pages/search/page';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={SearchPage} />
  </Route>
);
