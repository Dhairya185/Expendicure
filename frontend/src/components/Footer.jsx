import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <span className="footer-brand">Expendicure</span> © 2024 Expendicure. Financial progress for students.
        </div>
        <div className="footer-links">
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Terms of Service</Link>
          <Link to="#">Help Center</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
