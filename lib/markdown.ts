function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyInlineMarkdown(text: string) {
  let output = escapeHtml(text);

  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );

  return output;
}

export function renderMarkdown(markdown: string) {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return '<p class="empty">暂无预览内容</p>';
  }

  const lines = normalized.split("\n");
  const html: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  const codeBuffer: string[] = [];

  const flushList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
      inCodeBlock = false;
      codeBuffer.length = 0;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      html.push(
        `<h${level}>${applyInlineMarkdown(headingMatch[2].trim())}</h${level}>`,
      );
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${applyInlineMarkdown(listMatch[1].trim())}</li>`);
      continue;
    }

    flushList();

    if (line.startsWith("> ")) {
      html.push(`<blockquote>${applyInlineMarkdown(line.slice(2).trim())}</blockquote>`);
      continue;
    }

    html.push(`<p>${applyInlineMarkdown(line.trim())}</p>`);
  }

  flushList();
  flushCodeBlock();

  return html.join("");
}
