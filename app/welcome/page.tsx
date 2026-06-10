import { ArrowRight, CheckCircle2, Database, ExternalLink, KeyRound, Link2, MapPinned } from "lucide-react";
import Link from "next/link";
import styles from "./welcome.module.css";

const steps = [
  {
    title: "Duplicate the Notion template",
    body: "Start from the public Atlas template so the database already has names, addresses, coordinates, status colors, amenities, and notes.",
    action: "Open template",
    href: "https://app.notion.com/p/30cdd2e535934cc8990577973859bcff",
    icon: Database,
    frame: "Template page with the live Atlas embed above the Accounts database.",
  },
  {
    title: "Create an internal integration",
    body: "Create an internal integration in Notion. Copy the token that starts with ntn_ or secret_.",
    action: "Open integrations",
    href: "https://www.notion.so/my-integrations",
    icon: KeyRound,
    frame: "Notion integration settings with the Internal Integration Token field highlighted.",
  },
  {
    title: "Share your database",
    body: "Open the duplicated Accounts database, use Connections, and add your integration. Atlas can only see databases you share.",
    action: "Continue",
    href: "/setup",
    icon: Link2,
    frame: "Database menu showing Connections and the selected Atlas integration.",
  },
  {
    title: "Paste the token",
    body: "The setup wizard validates the token with Notion, then lists only the databases shared with that integration.",
    action: "Start setup",
    href: "/setup",
    icon: CheckCircle2,
    frame: "Atlas setup screen with the token field and Continue button.",
  },
  {
    title: "Render your map",
    body: "Pick the database, review the suggested mapping, and render the map. Optional fields can wait.",
    action: "Map your database",
    href: "/setup",
    icon: MapPinned,
    frame: "Review suggested fields with Name, Address, Status, and Badges mapped.",
  },
];

export default function WelcomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Link className={styles.backLink} href="/">Open demo map</Link>
        <h1>Make it yours in 5 steps</h1>
        <p>
          Duplicate the template, connect one Notion integration, and render your own map without opening the docs.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} href="/setup">
            Start setup <ArrowRight size={16} />
          </Link>
          <a className={styles.secondaryAction} href="https://github.com/brycejohnson1417/atlas-for-notion" target="_blank" rel="noreferrer">
            View repo <ExternalLink size={15} />
          </a>
        </div>
      </section>

      <section className={styles.steps} aria-label="Atlas setup steps">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article key={step.title} className={styles.stepCard}>
              <div className={styles.stepNumber}>{index + 1}</div>
              <div className={styles.stepContent}>
                <Icon size={20} />
                <h2>{step.title}</h2>
                <p>{step.body}</p>
                {step.href.startsWith("http") ? (
                  <a href={step.href} target="_blank" rel="noreferrer">
                    {step.action} <ArrowRight size={14} />
                  </a>
                ) : (
                  <Link href={step.href}>
                    {step.action} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div className={styles.screenshotSlot}>
                <span>{step.frame}</span>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
