import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-heading">Company</h3>
            <ul className="footer-list">
              <li><a href="https://www.last.fm/about" className="footer-link">About Last.fm</a></li>
              <li><a href="https://www.last.fm/contact" className="footer-link">Contact Us</a></li>
              <li><a href="https://www.last.fm/jobs" className="footer-link">Jobs</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Help</h3>
            <ul className="footer-list">
              <li><a href="https://www.last.fm/help" className="footer-link">Track My Music</a></li>
              <li><a href="https://www.last.fm/help/faq" className="footer-link">Community Guidelines</a></li>
              <li><a href="https://www.last.fm/help/guidelines" className="footer-link">Support</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Account</h3>
            <ul className="footer-list">
              <li><a href="https://www.last.fm/inbox" className="footer-link">Inbox</a></li>
              <li><a href="https://www.last.fm/settings" className="footer-link">Settings</a></li>
              <li><a href="https://www.last.fm/pro" className="footer-link">Last.fm Pro</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-heading">Follow Us</h3>
            <div className="footer-social">
              <a href="https://www.facebook.com/lastfm" className="social-link" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://twitter.com/lastfm" className="social-link" target="_blank" rel="noopener noreferrer">X</a>
              <a href="https://bsky.app/profile/lastfm.bsky.social" className="social-link" target="_blank" rel="noopener noreferrer">Bluesky</a>
              <a href="https://www.instagram.com/last_fm" className="social-link" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://www.youtube.com/user/lastfm" className="social-link" target="_blank" rel="noopener noreferrer">YouTube</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 