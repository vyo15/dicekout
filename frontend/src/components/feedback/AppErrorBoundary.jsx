import { Component } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import BrandMark from "../common/BrandMark";
import { withBasePath } from "../../config/site";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <div className="fatal-error__card">
            <BrandMark className="fatal-error__logo" />
            <FiAlertTriangle className="fatal-error__icon" aria-hidden="true" />
            <h1>Halaman gagal ditampilkan</h1>
            <p>Terjadi kesalahan saat membuka DicekOut. Muat ulang halaman untuk mencoba kembali.</p>
            <div className="fatal-error__actions">
              <button type="button" onClick={() => window.location.reload()}>
                <FiRefreshCw aria-hidden="true" />
                Muat ulang
              </button>
              <a href={withBasePath("")}>Kembali ke beranda</a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
