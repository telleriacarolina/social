
import Link from "next/link";

import styles from "./page.module.css";

const features = [
  {
    icon: "✦",
    title: "Share Your World",
    description:
      "Share photos, videos, ideas, and everyday moments with people who matter.",
  },
  {
    icon: "◇",
    title: "Discover Your Interests",
    description:
      "Explore communities, conversations, creators, and content that inspire you.",
  },
  {
    icon: "♡",
    title: "Build Real Connections",
    description:
      "Create meaningful relationships through private conversations and shared interests.",
  },
  {
    icon: "▧",
    title: "Bring Social Together",
    description:
      "Explore a connected social experience designed to bring your online worlds closer.",
  },
  {
    icon: "◎",
    title: "Find Your Community",
    description:
      "Connect with people around shared passions, ideas, and experiences.",
  },
  {
    icon: "✧",
    title: "Your Identity, Your Control",
    description:
      "Privacy and account security are foundational principles of the platform.",
  },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Social home">
          social<span>.</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className={styles.headerActions}>
          <Link href="/login" className={styles.loginButton}>
            Log in
          </Link>

          <Link href="/signup" className={styles.headerAction}>
            Sign up
          </Link>
        </div>
      </header>

      <section className={styles.hero} id="about">
        <span className={styles.eyebrow}>
          A NEW WAY TO CONNECT
        </span>

        <h1>
          All Your Social Worlds.
          <br />
          <span>One Place.</span>
        </h1>

        <p className={styles.heroDescription}>
          A social experience built around sharing, discovery,
          meaningful connections, and communities. Bring your
          interests together in one place.
        </p>

        <div className={styles.heroActions}>
          <Link href="#features" className={styles.primaryButton}>
            Discover the Vision
          </Link>

          <a href="#about" className={styles.secondaryButton}>
            Learn About Us
          </a>
        </div>
      </section>

      <section
        className={styles.features}
        id="features"
        aria-labelledby="features-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="features-heading">
            Everything that brings us together.
          </h2>
          <p>
            More ways to express yourself, discover interests,
            and connect with others.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article
              className={styles.featureCard}
              key={feature.title}
            >
              <div className={styles.featureIcon} aria-hidden="true">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} Social. All Your Social Worlds.
          One Place.
        </p>
      </footer>
    </main>
  );
}
