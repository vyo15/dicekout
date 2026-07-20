import { FiRefreshCw, FiShield } from "react-icons/fi";
import { backupLabels, formatDateTime } from "../catalogManagerUtils.js";

export const BackupHistory = ({ backups, busy, onReload, onSelectBackup }) => (
  <>
    <header className="topbar">
      <div>
        <span className="eyebrow">Catalog Manager / Riwayat</span>
        <h1>Backup & rollback</h1>
        <p>Setiap operasi berisiko memiliki titik pemulihan lokal. Backup tidak ikut Git atau deployment.</p>
      </div>
      <div className="topbar__actions">
        <button className="button" onClick={onReload} disabled={busy}>
          <FiRefreshCw aria-hidden="true" /> Muat ulang
        </button>
      </div>
    </header>
    <section className="backup-grid">
      {backups.length ? backups.map((backup) => (
        <article className="backup-card" key={backup.id}>
          <div className="backup-card__icon"><FiShield aria-hidden="true" /></div>
          <div className="backup-card__body">
            <span className="eyebrow">{backupLabels[backup.operation] || backup.operation}</span>
            <h2>{backup.product?.name || "Kondisi katalog"}</h2>
            <p>{formatDateTime(backup.createdAt)}</p>
            {backup.issue && <small>{backup.issue}</small>}
          </div>
          <button className="button" disabled={!backup.restorable || busy} onClick={() => onSelectBackup(backup)}>
            <FiRefreshCw aria-hidden="true" /> Pulihkan
          </button>
        </article>
      )) : (
        <div className="catalog-empty">
          <strong>Belum ada backup.</strong>
          <p>Backup muncul setelah apply, delete, atau rollback.</p>
        </div>
      )}
    </section>
  </>
);
