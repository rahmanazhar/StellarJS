import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <h1>⭐ Welcome to StellarJS</h1>
        <p>A modern fullstack JavaScript framework</p>
      </header>

      <main className="home-content">
        <section className="features">
          <h2>Get Started</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>🚀 Fast Development</h3>
              <p>Build fullstack apps with integrated frontend and backend</p>
            </div>
            <div className="feature-card">
              <h3>🔒 Built-in Auth</h3>
              <p>Ready-to-use authentication with JWT support</p>
            </div>
            <div className="feature-card">
              <h3>📦 Microservices</h3>
              <p>Built-in support for microservices architecture</p>
            </div>
            <div className="feature-card">
              <h3>⚡️ TypeScript</h3>
              <p>First-class TypeScript support out of the box</p>
            </div>
          </div>
        </section>

        <section className="actions">
          <Link to="/about" className="btn btn-primary">
            Learn More
          </Link>
          <a
            href="https://github.com/rahmanazhar/StellarJS"
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </section>
      </main>
    </div>
  );
}

export default Home;
