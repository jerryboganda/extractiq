import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { articles } from "@/lib/blogData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ShareButtons = ({ title, slug }: { title: string; slug: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const url = `${window.location.origin}/blog/${slug}`;
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast({ title: "Link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-border">
      <Share2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground mr-1">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        𝕏
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        LinkedIn
      </a>
      <button onClick={copyLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
};

const BlogPost = () => {
  const { slug } = useParams();
  const article = articles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="text-2xl font-bold text-foreground">Article not found</h1>
          <Link to="/blog" className="text-primary hover:underline mt-4 inline-block">← Back to blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const related = articles.filter((a) => a.slug !== slug).slice(0, 2);

  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, i) => {
      if (block.startsWith("## ")) {
        return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{block.replace("## ", "")}</h2>;
      }
      if (block.startsWith("**") && block.endsWith("**")) {
        return <p key={i} className="font-semibold text-foreground mb-2">{block.replace(/\*\*/g, "")}</p>;
      }
      if (block.startsWith("- ")) {
        const items = block.split("\n").filter(Boolean);
        return (
          <ul key={i} className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
            {items.map((item, j) => <li key={j}>{item.replace("- ", "")}</li>)}
          </ul>
        );
      }
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="text-muted-foreground leading-relaxed mb-4">
          {parts.map((part, j) =>
            part.startsWith("**") ? <strong key={j} className="text-foreground">{part.replace(/\*\*/g, "")}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <article className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          <Badge variant="secondary" className="mb-4">{article.category}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{article.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-12">
            <span>{new Date(article.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>

          <div className="prose-custom">{renderContent(article.content)}</div>

          <ShareButtons title={article.title} slug={article.slug} />
        </div>
      </article>

      <section className="py-16 px-4 bg-primary/5 border-y border-primary/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to see ExtractIQ in action?</h2>
          <Link to="/demo">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Book a Demo</Button>
          </Link>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-foreground mb-8">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {related.map((a) => (
                <Link key={a.slug} to={`/blog/${a.slug}`} className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
                  <Badge variant="secondary" className="mb-2 text-xs">{a.category}</Badge>
                  <h4 className="font-bold text-foreground mb-1">{a.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
