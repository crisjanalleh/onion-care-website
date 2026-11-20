/** Renders admin-authored plain-text content with paragraph breaks and simple bullets. */
export default function ArticleBody({ text, className = "" }) {
  if (!text) return null;
  const blocks = String(text).split(/\n{2,}/);

  return (
    <div className={`oc-prose text-[0.9375rem] text-foreground/90 ${className}`}>
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter((line) => line.trim().length > 0);
        const isList = lines.length > 1 && lines.every((line) => /^[-•*]\s+/.test(line.trim()));
        if (isList) {
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{line.replace(/^[-•*]\s+/, "")}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}