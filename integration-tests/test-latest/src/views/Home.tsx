
import { h } from 'preact';
import { Link } from 'preact-router';
import '../home.css'
// import { Container } from './Container';

const Home = () => (
  <div className="header">
    <h1>Home</h1>
    <nav>
      <Link href="/" class="links">Home</Link>
      <Link href="/about" class="links">About</Link>
    </nav>
    <p>Welcome to the Home page!</p>
    <div>

    </div>
  </div>
);

export default Home;