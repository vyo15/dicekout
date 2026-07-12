import { FiInfo } from "react-icons/fi";
import { SITE } from "../../config/site";

const DemoNotice = () => {
  if (SITE.catalogMode !== "demo") return null;
  return (
    <div className="demo-notice" role="note">
      <FiInfo aria-hidden="true" />
      <span>
        Katalog ini masih memakai data contoh. Link marketplace, foto, dan informasi produk asli belum dimasukkan.
      </span>
    </div>
  );
};

export default DemoNotice;
