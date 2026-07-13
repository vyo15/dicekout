import BrandMark from "../common/BrandMark";

const LoadingScreen = () => (
  <div className="loading-screen" role="status" aria-live="polite">
    <BrandMark className="loading-screen__logo" />
    <span className="loading-screen__spinner" aria-hidden="true" />
    <p>Menyiapkan DicekOut...</p>
  </div>
);

export default LoadingScreen;
