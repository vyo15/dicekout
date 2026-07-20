import { FiExternalLink, FiInfo, FiShoppingBag } from "react-icons/fi";
import Seo from "../components/common/Seo";
import Breadcrumbs from "../components/common/Breadcrumbs";
import { SITE } from "../config/site";
import { formatLongDate } from "../utils/formatDate.js";

const DisclosurePage = () => (
  <>
    <Seo
      title="Disclosure Affiliate | DicekOut"
      description="Penjelasan transparan tentang cara kerja tautan affiliate di DicekOut."
      path="disclosure"
    />

    <section className="page-hero page-hero--compact">
      <div className="container">
        <Breadcrumbs items={[{ label: "Beranda", to: "/" }, { label: "Disclosure Affiliate" }]} />
        <span className="eyebrow">Transparansi</span>
        <h1>Disclosure affiliate DicekOut.</h1>
        <p>Penjelasan tentang hubungan antara rekomendasi, tautan marketplace, dan komisi affiliate.</p>
      </div>
    </section>

    <section className="section section--surface legal-section">
      <div className="container legal-layout">
        <aside className="legal-summary">
          <FiInfo aria-hidden="true" />
          <h2>Ringkasnya</h2>
          <p>Beberapa tautan di DicekOut dapat menghasilkan komisi tanpa menambah harga yang Anda bayar.</p>
        </aside>

        <article className="legal-content">
          <h2>Bagaimana link affiliate bekerja</h2>
          <p>
            Saat pengunjung membuka tautan tertentu lalu melakukan transaksi yang memenuhi ketentuan marketplace,
            DicekOut dapat menerima komisi dari program affiliate terkait.
          </p>

          <h2>Harga dan keputusan pembelian</h2>
          <p>
            Komisi affiliate tidak menjadi alasan untuk menampilkan harga, stok, promo, rating, atau klaim yang tidak benar.
            Informasi final selalu mengikuti halaman marketplace dan keputusan pembelian tetap berada pada pengunjung.
          </p>

          <h2>Hubungan dengan marketplace</h2>
          <p>
            DicekOut bukan marketplace, penjual, penyedia pembayaran, atau pihak yang memproses pesanan.
            Pengiriman, pembayaran, retur, garansi, dan layanan transaksi mengikuti kebijakan penjual serta marketplace.
          </p>

          <div className="legal-callout">
            <FiShoppingBag aria-hidden="true" />
            <div><strong>Sebelum membeli</strong><p>Periksa kembali nama penjual, variasi, spesifikasi, ongkir, harga, dan kebijakan retur di marketplace.</p></div>
          </div>

          <h2>Penandaan tautan</h2>
          <p>
            Tautan marketplace dibuka di tab baru dan ditandai sebagai sponsored/nofollow pada kode halaman.
            Parameter referral atau campaign pada tautan tidak dipotong oleh tampilan DicekOut.
          </p>

          <p className="legal-footnote"><FiExternalLink aria-hidden="true" /> Halaman ini perlu ditinjau kembali sebelum katalog beralih dari mode demo ke mode publik.</p>

          <h2>Pengelola dan pembaruan</h2>
          <p>
            {SITE.operatorName ? `DicekOut dikelola oleh ${SITE.operatorName}. ` : "Identitas pengelola akan dilengkapi sebelum mode live. "}
            {SITE.contactEmail ? <>Pertanyaan dapat dikirim ke <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.</> : "Kontak publik belum diaktifkan pada mode demo."}
          </p>
          {SITE.policyUpdatedAt ? <p className="legal-footnote">Terakhir diperbarui: {formatLongDate(SITE.policyUpdatedAt)}.</p> : null}
        </article>
      </div>
    </section>
  </>
);

export default DisclosurePage;
