import React from 'react';
import '../styles/Footer.css';
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../assets/Image/120ESWhite.png';
import { HashLink } from 'react-router-hash-link';

export default function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="footer-section left">
          <a href="/"><img src={logo} alt="120 East State Logo" className='footer-logo'></img></a>
          <p className="tagline">Transforming the Steeple Center</p>
          <div className="social-icons">
            <a href="https://www.facebook.com/120eaststate" target='_blank'><FaFacebookF /></a>
            <a href="https://www.instagram.com/120eaststate/" target='_blank'><FaInstagram /></a>
            <a href="https://x.com/120eaststate/" target='_blank'><FaTwitter /></a>
            <a href="https://www.linkedin.com/company/120eaststate/" target='_blank'><FaLinkedinIn /></a>
            <a href="https://www.youtube.com/@120EastState" target='_blank'><FaYoutube /></a>
          </div>
        </div>

        <div className="footer-section center">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/announcements">Announcements</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/archive">Archive</Link></li>
            <li><a href="https://120eaststate.org/" target='_blank'>Visit 120EastState Page</a></li>
          </ul>
        </div>

        <div className="footer-section right">
          <h3>Get In Touch</h3>
          <p>Email: hello@120eaststate.org</p>
          <p>Phone: 609-222-4246</p>
          <HashLink
            id="contact-link"
            to="/about#contact-section"
            scroll={el => el.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            Contact Us
          </HashLink>
        </div>
      </footer>
    </>
  );
}
