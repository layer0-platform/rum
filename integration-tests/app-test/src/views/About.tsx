
import { h } from 'preact';
import { Link } from 'preact-router';

const About = () => (
  <div>
    <h1>About hello</h1>
    <nav>
      <Link href="/">back home</Link>
    </nav>
    <p>Welcome to the Home page!</p>
  </div>
);

export default About;