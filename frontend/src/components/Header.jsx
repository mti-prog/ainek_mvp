import './Header.css';

export default function Header({ connected }) {
  return (
    <header className="header">
      <div className="header-brand">
        <span className="header-logo">AINEK</span>
        <span className="header-tagline">AI-Powered Virtual Try-On</span>
      </div>
      <div className="header-status">
        <span className="header-connection-label">
          {connected ? 'Connected' : 'Offline'}
        </span>
        <div
          className={`header-connection-dot ${connected ? 'connected' : 'disconnected'}`}
        />
      </div>
    </header>
  );
}
