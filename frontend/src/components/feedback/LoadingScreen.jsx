const LoadingScreen = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <span className="loading-screen__mark" aria-hidden="true">D</span>
    <span className="loading-screen__spinner" aria-hidden="true" />
    <p>Menyiapkan DicekOut...</p>
  </div>
);

export default LoadingScreen;
