import Link from "next/link";
import styles from "./izira-home.module.css";

export default function Home(){
  return <main className={styles.page}>
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.nav}`}>
        <Link href="/" className={styles.brand}>IZIRA</Link>
        <nav className={styles.navLinks} aria-label="Primary navigation">
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#services">Services</a>
          <a href="mailto:hello@izira.xyz" className={styles.cta}>Get in touch</a>
        </nav>
      </div>
    </header>

    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Builders. Thinkers. Partners.</p>
          <h1>We build digital products with purpose and clarity.</h1>
          <p>We’re an independent digital product company focused on building software and platforms that make a difference.</p>
          <a className={styles.textLink} href="#about">Learn more about us →</a>
        </div>
      </div>
    </section>

    <section className={styles.section} id="about">
      <div className={`${styles.container} ${styles.split}`}>
        <div>
          <p className={styles.eyebrow}>About IZIRA</p>
          <h2>We are builders, thinkers, and partners.</h2>
          <p>IZIRA is the parent company behind a growing portfolio of digital products, each created for a different audience and purpose.</p>
          <p>We turn strong ideas into focused, useful products — then give each one room to grow as its own brand.</p>
          <a className={styles.textLink} href="#work">Explore our products →</a>
        </div>
        <div className={styles.visual} aria-hidden="true"><div className={styles.monogram}>IZ</div></div>
      </div>
    </section>

    <section className={styles.section} id="services">
      <div className={styles.container}>
        <div className={styles.servicesIntro}>
          <div><p className={styles.eyebrow}>What we do</p><h2>We build. We partner. We grow.</h2></div>
          <p>From product strategy to engineering and growth, we build and support digital products designed to create real value.</p>
        </div>
        <div className={styles.serviceGrid}>
          {[['Product Building','End-to-end product development that turns ideas into scalable, useful products.'],['Platform Engineering','Secure, future-ready platforms built for performance and growth.'],['Digital Solutions','Focused digital tools that solve real problems and unlock opportunities.'],['Strategic Partnership','Long-term product partnerships combining technology, insight and execution.']].map(([title,copy])=><article className={styles.serviceCard} key={title}><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </div>
    </section>

    <section className={styles.approach}>
      <div className={`${styles.container} ${styles.approachGrid}`}>
        <div><p className={styles.eyebrow}>Our approach</p><h2>Clarity. Simplicity. Purpose.</h2><p>We believe the best solutions are built with clarity of purpose and a commitment to people.</p></div>
        <div className={styles.steps}>
          {[['01','Understand','We start by understanding people, problems and opportunities deeply.'],['02','Design','We design solutions that are simple, intuitive and useful.'],['03','Build & Grow','We build with quality and keep improving for long-term growth.']].map(([n,title,copy])=><article className={styles.step} key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </div>
    </section>

    <section className={styles.section} id="work">
      <div className={styles.container}>
        <p className={styles.eyebrow}>Our products</p>
        <h2>Digital products making a real impact.</h2>
        <div className={styles.products}>
          <article className={styles.product}><div className={styles.productType}>Small business platform</div><h3>KADAI</h3><p>A simple online place for microbusinesses to sell products, take bookings, manage capacity, handle transport or runner requests, and stay organised.</p><Link href="/kadai">Explore KADAI →</Link><div className={styles.kadaiTag}>Buka Kadai. Start Jual.</div></article>
          <article className={styles.product}><div className={styles.productType}>Digital wedding experiences</div><h3>myPOV</h3><p>Digital invitations, guestbooks and interactive wedding experiences designed to capture every perspective of the day.</p><a href="https://mypov.site">Visit myPOV →</a></article>
          <article className={styles.product}><div className={styles.productType}>Ramadan & Shawwal</div><h3>Yusra</h3><p>A private, gentle Ramadan-to-Shawwal digital experience built around reflection, habits, journaling and meaningful personal keepsakes.</p><span className={styles.kadaiTag}>In development</span></article>
        </div>
      </div>
    </section>

    <section className={styles.contact}>
      <div className={`${styles.container} ${styles.contactInner}`}>
        <div><h2>Have an idea in mind?</h2><p>Let’s build something meaningful together.</p></div>
        <a className={styles.cta} href="mailto:hello@izira.xyz">Get in touch →</a>
      </div>
    </section>

    <footer className={styles.footer}>
      <div className={`${styles.container} ${styles.footerGrid}`}>
        <div><div className={styles.brand}>IZIRA</div><p>We build digital products that create real impact.</p></div>
        <div><h4>Company</h4><a href="#about">About</a><a href="mailto:hello@izira.xyz">Contact</a></div>
        <div><h4>Work</h4><Link href="/kadai">KADAI</Link><a href="https://mypov.site">myPOV</a></div>
        <div><h4>Legal</h4><a href="#">Privacy Policy</a><a href="#">Terms of Use</a></div>
      </div>
      <div className={`${styles.container} ${styles.footerBottom}`}><span>© 2026 IZIRA. All rights reserved.</span><span>Brunei Darussalam</span></div>
    </footer>
  </main>
}
