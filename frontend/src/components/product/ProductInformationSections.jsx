import { Link } from "react-router-dom";
import { FiAlertCircle, FiCheck, FiUserCheck, FiUserX } from "react-icons/fi";

const ProductInformationSections = ({ product, productCollections }) => (
  <>
    <section className="product-info-section section section--soft">
      <div className="container product-info-grid">
        <article className="info-card info-card--positive">
          <span className="info-card__icon"><FiCheck aria-hidden="true" /></span>
          <h2>Kelebihan</h2>
          <ul>{product.pros.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="info-card info-card--attention">
          <span className="info-card__icon"><FiAlertCircle aria-hidden="true" /></span>
          <h2>Perlu diperhatikan</h2>
          <ul>{product.considerations.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        <article className="info-card info-card--fit">
          <span className="info-card__icon"><FiUserCheck aria-hidden="true" /></span>
          <h2>Cocok untuk</h2>
          <ul>{product.suitableFor.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>

        {(product.notSuitableFor || []).length ? (
          <article className="info-card info-card--neutral">
            <span className="info-card__icon"><FiUserX aria-hidden="true" /></span>
            <h2>Tidak cocok untuk</h2>
            <ul>{product.notSuitableFor.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ) : null}
      </div>
    </section>

    <section className="product-description-section section section--surface">
      <div className="container product-description-grid">
        <article>
          <span className="eyebrow">Tentang produk</span>
          <h2>Informasi yang perlu diketahui</h2>
          <p>{product.description}</p>
          {productCollections.length ? (
            <div className="product-collections">
              <strong>Produk ini ada di koleksi:</strong>
              <div>
                {productCollections.map((collection) => (
                  <Link key={collection.id} to={`/koleksi/${collection.slug}`}>{collection.name}</Link>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <aside className="transparency-card">
          <h2>Catatan transparansi</h2>
          <p>
            DicekOut tidak melakukan checkout, memproses pembayaran, atau menjamin harga dan stok.
            Transaksi berlangsung di marketplace yang kamu pilih.
          </p>
          <Link className="text-link" to="/disclosure">Pelajari disclosure affiliate</Link>
        </aside>
      </div>
    </section>
  </>
);

export default ProductInformationSections;
