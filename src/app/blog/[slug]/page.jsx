import { notFound } from 'next/navigation';
import { ElementorDocument } from '../../../lib/elementor/render.jsx';
import { templates, listings, rows } from '../../../lib/content.js';
import NavMenu from '../../../components/NavMenu.jsx';

const defaultSingle = Object.values(templates).find(
  (t) => t.kind === 'single-post' && /default/i.test(t.name)
);

// Fixed content set: unknown slugs 404 rather than render on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return rows.posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = rows.posts.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.excerpt || undefined,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { title: p.title, type: 'article', publishedTime: p.date, images: p.thumbnail ? [p.thumbnail] : undefined },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const index = rows.posts.findIndex((p) => p.slug === slug);
  if (index === -1 || !defaultSingle) notFound();

  const post = rows.posts[index];
  return (
    <div className={`elementor-page elementor-page-${post.id}`}>
      <ElementorDocument
        id={defaultSingle.id}
        tree={defaultSingle.tree}
        kind="single-post"
        ctx={{
          NavMenu,
          listings,
          post,
          siblings: { prev: rows.posts[index - 1] || null, next: rows.posts[index + 1] || null },
        }}
      />
    </div>
  );
}
