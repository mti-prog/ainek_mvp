import './StatusBar.css';

export default function StatusBar({ status }) {
  const gpuClass = status.gpu_available ? 'active' : 'inactive';
  const modelClass = status.model_loaded ? 'active' : 'warning';
  const cameraClass = status.camera_active ? 'active' : 'inactive';

  return (
    <footer className="status-bar">
      <div className="status-bar-item">
        <span className={`status-pill ${gpuClass}`}>
          <span className="dot" />
          GPU {status.gpu_available ? (status.gpu_name || 'Ready') : 'N/A'}
        </span>
      </div>
      <div className="status-bar-item">
        <span className={`status-pill ${modelClass}`}>
          <span className="dot" />
          Model {status.model_loaded ? 'Loaded' : 'Not Loaded'}
        </span>
      </div>
      <div className="status-bar-item">
        <span className={`status-pill ${cameraClass}`}>
          <span className="dot" />
          Camera {status.camera_active ? 'Active' : 'Off'}
        </span>
      </div>
      <div className="status-bar-item" style={{ color: 'var(--text-muted)' }}>
        <span style={{ fontSize: 'var(--font-size-xs)' }}>
          DS-VTON: {status.lo_res?.[0]}×{status.lo_res?.[1]} → {status.hi_res?.[0]}×{status.hi_res?.[1]}
        </span>
      </div>
    </footer>
  );
}
