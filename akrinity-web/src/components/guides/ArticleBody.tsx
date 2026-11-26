import Link from 'next/link';
import { Pic } from '@/components/ui/Pic';
import { inlineText, type Block, type Inline } from '@/lib/article-content';

function Runs({ runs }: { runs: Inline[] }) {
  return runs.map((r, i) => {
    let node: React.ReactNode = r.text;
    if (r.i) node = <em>{node}</em>;
    if (r.b) node = <strong>{node}</strong>;
    if (r.href) {
      node = r.href.startsWith('/') ? (
        <Link href={r.href}>{node}</Link>
      ) : (
        <a href={r.href} rel="noopener noreferrer">
          {node}
        </a>
      );
    }
    return <span key={i}>{node}</span>;
  });
}

function Figure({ block }: { block: Extract<Block, { t: 'img' }> }) {
  // Square and tall pictures (product photos) are shown smaller than wide diagrams.
  const tall = block.width && block.height ? block.width / block.height < 1.2 : false;
  return (
    <figure className={tall ? 'article-figure tall' : 'article-figure'}>
      <a href={block.src} target="_blank" rel="noopener noreferrer" title="Open the full picture">
        <Pic
          src={block.src}
          alt={block.alt}
          width={block.width}
          height={block.height}
          sizes="(max-width: 760px) 100vw, 720px"
          widths={[384, 640, 828, 1080, 1920]}
        />
      </a>
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

function renderBlock(b: Block, i: number) {
  switch (b.t) {
    case 'p':
      return (
        <p key={i}>
          <Runs runs={b.content} />
        </p>
      );
    case 'h2':
      return <h2 key={i}>{b.text}</h2>;
    case 'h3':
      return <h3 key={i}>{b.text}</h3>;
    case 'ul':
    case 'ol': {
      const List = b.t;
      return (
        <List key={i}>
          {b.items.map((item, j) => (
            <li key={j}>
              <Runs runs={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'tip':
      return (
        <aside key={i} className="callout">
          {b.content.map((runs, j) => (
            <p key={j}>
              <Runs runs={runs} />
            </p>
          ))}
        </aside>
      );
    case 'img':
      return <Figure key={i} block={b} />;
    case 'table':
      // Wide tables scroll inside their own box, so the page never scrolls sideways.
      return (
        <div
          key={i}
          className="table-scroll"
          role="region"
          aria-label={b.head.length ? `Table: ${b.head.map(inlineText).join(', ')}` : 'Table'}
          tabIndex={0}
        >
          <table>
            {b.head.length > 0 && (
              <thead>
                <tr>
                  {b.head.map((h, j) => (
                    <th key={j} scope="col">
                      <Runs runs={h} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {b.rows.map((r, j) => (
                <tr key={j}>
                  {r.map((c, k) => (
                    <td key={k}>
                      <Runs runs={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div id="article-body" className="body">
      {blocks.map(renderBlock)}
    </div>
  );
}
