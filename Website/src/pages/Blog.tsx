import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageMeta from "@/components/layout/PageMeta";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { articles } from "@/lib/blogData";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const Blog = () => {
  const heroRef = useScrollReveal();

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Blog — ExtractIQ Insights on Document Intelligence" description="Insights on document intelligence, AI extraction, learning technology, and enterprise content operations." />
      <Navbar />

      <section ref={heroRef} className="scroll-reveal pt-32 pb-16 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">Blog</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Insights on document intelligence, AI extraction, and learning technology.
        </p>
      </section>

      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              key={article.slug}
              to={`/blog/${article.slug}`}
              className="group block rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
            >
              <Badge variant="secondary" className="mb-3 text-xs">{article.category}</Badge>
              <h2 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{article.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>·</span>
                <span>{article.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
