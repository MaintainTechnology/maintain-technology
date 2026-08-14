import { notFound } from 'next/navigation';
import { ElementorDocument } from '../../../lib/elementor/render.jsx';
import { singleNewsletter, listings, rows } from '../../../lib/content.js';
import NavMenu from '../../../components/NavMenu.jsx';

export function generateStaticParams() {
  return rows.newsletters.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const n = rows.newsletters.find((x) => x.slug === slug);
  if (!n) return {};
  return {
    title: n.title,
    alternates: { canonical: `/strikeforce-newsletter/${n.slug}` },
    openGraph: { title: n.title, type: 'article', publishedTime: n.date },
  };
}

export default async function NewsletterPage({ params }) {
  const { slug } = await params;
  const index = rows.newsletters.findIndex((n) => n.slug === slug);
  if (index === -1 || !singleNewsletter) notFound();

  const post = rows.newsletters[index];
  return (
    <div className={`elementor-page elementor-page-${post.id}`}>
      <ElementorDocument
        id={singleNewsletter.id}
        tree={singleNewsletter.tree}
        kind="single-post"
        ctx={{
          NavMenu,
          listings,
          post,
          siblings: {
            prev: rows.newsletters[index - 1] || null,
            next: rows.newsletters[index + 1] || null,
          },
        }}
      />
    </div>
  );
}
