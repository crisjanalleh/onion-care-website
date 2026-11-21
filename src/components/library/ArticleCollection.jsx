export default function ArticleCollection({ articles = [] }) {
  return <div className="grid gap-4">{articles.length ? articles.map((article, index) => <article key={article.id ?? index} className="rounded-xl border p-4"><h2 className="font-semibold">{article.title}</h2>{article.summary ? <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p> : null}</article>) : <p className="text-sm text-muted-foreground">No articles available.</p>}</div>;
}
