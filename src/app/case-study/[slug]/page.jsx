import { notFound } from 'next/navigation';
import { ElementorDocument } from '../../../lib/elementor/render.jsx';
import { caseStudies, singleCaseStudy, listings, rows } from '../../../lib/content.js';
import NavMenu from '../../../components/NavMenu.jsx';

// Fixed content set: unknown slugs 404 rather than render on demand.
export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cs = caseStudies.find((c) => c.slug === slug);
  if (!cs) return {};
  return {
    title: cs.seo.title || cs.title,
    description: cs.seo.description || cs.fields.cs_content || undefined,
    alternates: { canonical: `/case-study/${cs.slug}` },
    openGraph: {
      title: cs.seo.title || cs.title,
      description: cs.seo.description || undefined,
      images: cs.thumbnail ? [cs.thumbnail] : undefined,
      type: 'article',
    },
  };
}

export default async function CaseStudyPage({ params }) {
  const { slug } = await params;
  const index = rows.caseStudies.findIndex((c) => c.slug === slug);
  if (index === -1) notFound();

  const post = rows.caseStudies[index];
  const siblings = {
    prev: rows.caseStudies[index - 1] || null,
    next: rows.caseStudies[index + 1] || null,
  };

  if (!singleCaseStudy) notFound();

  return (
    <div className={`elementor-page elementor-page-${post.id}`}>
      <ElementorDocument
        id={singleCaseStudy.id}
        tree={singleCaseStudy.tree}
        kind="single-post"
        ctx={{ NavMenu, listings, post, siblings }}
      />
    </div>
  );
}
