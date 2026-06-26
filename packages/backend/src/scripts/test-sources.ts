/**
 * 诊断脚本：测试所有内容源的连通性
 * 运行方式：npx ts-node packages/backend/src/scripts/test-sources.ts
 */
import axios from "axios";

const SOURCES = [
  {
    name: "BreakingNewsEnglish (RSS)",
    url: "https://breakingnewsenglish.com/feed.xml",
    timeout: 15_000,
  },
  {
    name: "Simple Wikipedia (API)",
    url: "https://simple.wikipedia.org/w/api.php?action=query&format=json&list=random&rnlimit=1&rnnamespace=0&origin=*",
    timeout: 15_000,
  },
  {
    name: "Gutendex (API)",
    url: "https://gutendex.com/books?languages=en&page_size=1",
    timeout: 15_000,
  },
  {
    name: "NewsAPI",
    url: "https://newsapi.org/v2/top-headlines?language=en&pageSize=1&apiKey=test",
    timeout: 15_000,
  },
] as const;

async function testSource(name: string, url: string, timeout: number) {
  const start = Date.now();
  try {
    const resp = await axios.get(url, { timeout });
    const elapsed = Date.now() - start;
    console.log(
      `  ✅ ${name} — ${resp.status} (${elapsed}ms, ${JSON.stringify(resp.data).length} chars)`,
    );
    return true;
  } catch (err: unknown) {
    const elapsed = Date.now() - start;
    const msg = axios.isAxiosError(err)
      ? `${err.code || "N/A"} | ${err.message}`
      : (err as Error).message;
    console.log(`  ❌ ${name} — ${msg} (${elapsed}ms)`);
    return false;
  }
}

async function main() {
  console.log("=== 内容源连通性诊断 ===\n");
  let ok = 0;
  let fail = 0;

  for (const s of SOURCES) {
    const result = await testSource(s.name, s.url, s.timeout);
    if (result) ok++;
    else fail++;
  }

  console.log(`\n=== 结果：${ok} 可用, ${fail} 不可用 ===`);
  if (fail === SOURCES.length) {
    console.log("\n⚠️ 所有源均不可用，可能需要配置 HTTP 代理。");
    console.log("   在 .env 中设置：HTTP_PROXY=http://127.0.0.1:7890");
  }
}

main().catch(console.error);
