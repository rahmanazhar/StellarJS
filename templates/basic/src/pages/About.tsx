import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

function About() {
  return (
    <div className="about">
      <header className="about-header">
        <h1>About StellarJS</h1>
      </header>

      <main className="about-content">
        <section className="about-section">
          <h2>What is StellarJS?</h2>
          <p>
            StellarJS is a modern fullstack JavaScript framework that combines React frontend with
            Express-based microservices architecture. It provides a complete solution for building
            scalable web applications.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          <ul>
            <li>Integrated frontend and backend development</li>
            <li>Built-in authentication with JWT</li>
            <li>TypeScript support out of the box</li>
            <li>Custom hooks for service integration</li>
            <li>CLI tools for rapid development</li>
            <li>Microservices architecture support</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Get Started</h2>
          <p>Start building your next great app with StellarJS today!</p>
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        </section>
      </main>
    </div>
  );
}

export default About;
