import { Component } from "react";
import { FiAlertTriangle } from "react-icons/fi";

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
            <FiAlertTriangle aria-hidden="true" />
            <h1>Halaman gagal ditampilkan</h1>
            <p>Terjadi kesalahan saat membuka DicekOut. Muat ulang halaman untuk mencoba kembali.</p>
            <button type="button" onClick={() => window.location.reload()}>Muat ulang</button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
