// routes.tsx


import { Router, Route } from 'preact-router';
import Home from './Home';
import About from './About';
const Routes = () => (
  <Router>
    <Route path="/" component={Home} />
    <Route path="/about" component={About} />
  </Router>
);

export default Routes;

