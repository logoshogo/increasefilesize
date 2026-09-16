import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const dynamic = 'force-dynamic';

export default function NewArticlePage() {
  return (
    <ArticleEditor
      initial={{
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        status: 'DRAFT',
        publishedAt: '',
      }}
    />
  );
}
