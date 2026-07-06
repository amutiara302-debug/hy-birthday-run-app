import Link from "next/link";
import { defaultSettings, formatRupiah } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">HY</span>
          <span>
            <strong>HediYunu5 8irthdayRun</strong>
            <small>#Headstrong Youthful</small>
          </span>
        </Link>
        <nav>
          <a href="#info">Informasi</a>
          <a href="#kategori">Kategori</a>
          <Link href="/register">Daftar</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <Link className="button primary" href="/register">Daftar Sekarang</Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-media">
            <div className="runner-card">
              <div className="editable-badge">HediYunu58irthdayRun</div>
              <div className="runner-portrait">
                <div className="runner-sun" />
                <img className="runner-photo" src="/hedi-run-cutout.png" alt="Hedi Yunus berlari" />
                <div className="runner-track" />
              </div>
            </div>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">Ulang Tahun Hedi Yunus ke-58</p>
            <h1>HediYunu58irthdayRun</h1>
            <p className="tagline">Rayakan hari spesial dengan gerak sehat bersama teman teman Akang dan peserta umum.</p>
            <p className="tagline-tags">#Headstrong Youthful&nbsp;&nbsp;#HY58</p>
            <div className="hero-actions">
              <Link className="button primary" href="/register">Daftar Sekarang</Link>
              <a className="button secondary" href="#kategori">Lihat Kategori</a>
            </div>
            <div className="quick-facts">
              <div><span>Jarak</span><strong>5,8KM</strong></div>
              <div><span>Offline</span><strong>30 Agustus 2026</strong></div>
              <div><span>Virtual</span><strong>24-30 Agustus 2026</strong></div>
            </div>
          </div>
        </section>

        <section className="section white story-section">
          <div className="story-copy">
            <p className="eyebrow">Cerita HY58</p>
            <h2>Dimulai saja dulu. Sehat bersama HY</h2>
            <p>Tetap berjiwa muda bukan hanya soal usia, tetapi tentang semangat untuk terus bergerak, menjaga diri, dan menjalani hidup dengan hati yang kuat.</p>
            <p>Di usia ke-58 ini, saya ingin mengajak teman-teman semua untuk kembali berlari, berjalan, selalu bergerak dan tertawa, sambil merayakan ulang tahun saya bersama sama. HY Birthday Run 58 bukan sekadar acara lari, tetapi ruang kebersamaan untuk saling menguatkan, saling menyemangati, dan memulai langkah sehat dengan cara yang menyenangkan.</p>
            <p>Dengan semangat Headstrong Youthful, kita percaya bahwa tubuh boleh bertambah usia, tetapi semangat harus tetap muda. Yang penting bukan seberapa cepat kita sampai, tetapi keberanian untuk mulai, konsisten bergerak, dan menikmati setiap langkahnya.</p>
            <p>Mari rayakan ulang tahun ini dengan energi baik, tubuh yang sehat, dan hati yang penuh syukur.</p>
          </div>
        </section>

        <section id="info" className="section white">
          <div className="section-heading">
            <p className="eyebrow">Informasi Acara</p>
            <h2>Sehat bersama Hedi Yunus Birthday Run 58</h2>
            <p className="section-subtitle">#Headstrong Youthful #HY58</p>
          </div>
          <div className="info-grid">
            <article>
              <span>Offline Run</span>
              <h3>{defaultSettings.offlineLocation}</h3>
              <p>Acara offline berlangsung pada {defaultSettings.offlineEventDate} dengan refreshment dan kesempatan meet & greet.</p>
            </article>
            <article>
              <span>Virtual Run</span>
              <h3>{defaultSettings.virtualPeriod}</h3>
              <p>Peserta virtual menyelesaikan 5,8KM lalu mengupload bukti lari dari Strava atau aplikasi lain.</p>
            </article>
            <article>
              <span>Pengiriman</span>
              <h3>Paket dikirim ke alamat peserta</h3>
              <p>Jersey dan medali dikirim ke peserta offline dan virtual. Resi dapat dilihat melalui link unik.</p>
            </article>
          </div>
          <article className="location-card">
            <div className="map-preview">
              <img src="/gudda-coffee-map.png" alt="Peta lokasi Gudda Coffee" />
            </div>
            <div>
              <p className="eyebrow">Lokasi Offline</p>
              <h3>{defaultSettings.offlineLocation}</h3>
              <p>{defaultSettings.offlineAddress}</p>
              <a className="button secondary" href={defaultSettings.mapDirectionUrl} target="_blank" rel="noreferrer">Buka Direction</a>
            </div>
          </article>
        </section>

        <section id="kategori" className="section">
          <div className="section-heading">
            <p className="eyebrow">Kategori & Harga</p>
            <h2>Pilih pengalaman lari kamu</h2>
          </div>
          <div className="category-grid">
            <article className="category-card">
              <div className="category-top"><span className="pill">Offline</span><span>Kuota 325</span></div>
              <h3>Offline Run 5,8KM</h3>
              <p className="price">{formatRupiah(defaultSettings.offlinePrice)} <small>+ ongkir {formatRupiah(defaultSettings.shippingFee)}</small></p>
              <ul>
                <li>Jersey</li>
                <li>Medali finisher</li>
                <li>Refreshment</li>
                <li>Kesempatan meet & greet</li>
              </ul>
              <Link className="button primary full" href="/register?category=Offline">Pilih Offline</Link>
            </article>
            <article className="category-card">
              <div className="category-top"><span className="pill">Virtual</span><span>Kuota 75</span></div>
              <h3>Virtual Run 5,8KM</h3>
              <p className="price">{formatRupiah(defaultSettings.virtualPrice)} <small>+ ongkir {formatRupiah(defaultSettings.shippingFee)}</small></p>
              <ul>
                <li>Jersey</li>
                <li>Medali</li>
                <li>Upload bukti lari</li>
                <li>Daftar finisher virtual</li>
              </ul>
              <Link className="button primary full" href="/register?category=Virtual">Pilih Virtual</Link>
            </article>
          </div>
        </section>

        <section className="section white">
          <div className="section-heading">
            <p className="eyebrow">Cara Daftar</p>
            <h2>Transfer manual, upload bukti, lalu cek email</h2>
          </div>
          <div className="steps">
            <div><span>1</span><strong>Pilih kategori</strong><p>Offline atau virtual 5,8KM.</p></div>
            <div><span>2</span><strong>Isi data</strong><p>Lengkapi data peserta, alamat, dan ukuran jersey.</p></div>
            <div><span>3</span><strong>Upload bukti bayar</strong><p>Transfer ke {defaultSettings.bankName} {defaultSettings.bankAccountNumber} a/n {defaultSettings.accountHolder}.</p></div>
            <div><span>4</span><strong>Cek email</strong><p>Link unik dikirim tanpa perlu login peserta.</p></div>
          </div>
        </section>

        <section className="section contact-band">
          <div>
            <p className="eyebrow">Kontak</p>
            <h2>Ada pertanyaan?</h2>
            <p>Email panitia: <a href={`mailto:${defaultSettings.contactEmail}`}>{defaultSettings.contactEmail}</a></p>
          </div>
          <Link className="button light" href="/register">Daftar Sekarang</Link>
        </section>
      </main>
    </>
  );
}
