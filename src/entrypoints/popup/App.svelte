<script lang="ts">
  import { onMount } from 'svelte';

  const VERIFY_ENDPOINT =
    'https://natfanclub-backend-809989871890.asia-southeast1.run.app/verify';
  const CACHE_STORAGE_KEY = 'verify-cache-v1';

  type CachedVerifyEntry = {
    Summary: string;
    fetchedAt: string;
  };

  let currentUrl = '';
  let summary = '';
  let error = '';
  let isLoading = false;
  let hasFetched = false;
  let summarySource: 'network' | 'cache' | '' = '';

  const summaryFallback =
    'Website brief description and summary will appear here once verification finishes.';

  const extractSummary = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') return '';

    const record = payload as {
      Summary?: unknown;
      contents?: { Summary?: unknown };
      content?: { Summary?: unknown };
    };

    const candidate =
      record.contents?.Summary ?? record.content?.Summary ?? record.Summary ?? '';

    return typeof candidate === 'string' ? candidate : '';
  };

  const getCachedVerifyEntry = async (url: string) => {
    const stored = (await browser.storage.local.get(CACHE_STORAGE_KEY)) as {
      [CACHE_STORAGE_KEY]?: Record<string, CachedVerifyEntry>;
    };

    return stored[CACHE_STORAGE_KEY]?.[url] ?? null;
  };

  const setCachedVerifyEntry = async (url: string, entry: CachedVerifyEntry) => {
    const stored = (await browser.storage.local.get(CACHE_STORAGE_KEY)) as {
      [CACHE_STORAGE_KEY]?: Record<string, CachedVerifyEntry>;
    };

    const nextCache = {
      ...(stored[CACHE_STORAGE_KEY] ?? {}),
      [url]: entry,
    };

    await browser.storage.local.set({
      [CACHE_STORAGE_KEY]: nextCache,
    });
  };

  async function loadCurrentTabUrl() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      currentUrl = tab?.url ?? '';
      if (!currentUrl) {
        throw new Error('현재 탭 URL을 읽지 못했습니다.');
      }
    } catch (err) {
      currentUrl = '';
      error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    }
  }

  async function loadSummary() {
    if (!currentUrl) return;

    isLoading = true;
    hasFetched = true;
    error = '';

    try {
      const cachedEntry = await getCachedVerifyEntry(currentUrl);
      if (cachedEntry) {
        summary = cachedEntry.Summary;
        summarySource = 'cache';
        return;
      }

      const response = await fetch(VERIFY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: currentUrl }),
      });

      if (!response.ok) {
        throw new Error(`Verify request failed: ${response.status}`);
      }

      const payload = (await response.json()) as unknown;
      summary = extractSummary(payload);
      summarySource = 'network';

      await setCachedVerifyEntry(currentUrl, {
        Summary: summary,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      summary = '';
      summarySource = '';
      error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    void loadCurrentTabUrl();
  });
</script>

<main class="popup-shell">
  <section class="hero-card">
    <div class="url-strip">
      <p class="section-label">Website Link</p>
      {#if currentUrl}
        <a class="url-link" href={currentUrl} target="_blank" rel="noreferrer">
          {currentUrl}
        </a>
      {:else}
        <span class="url-link muted">Loading current tab...</span>
      {/if}
    </div>

    <div class="lang-chip" aria-label="Language placeholder">
      <div class="lang-icon">Lang</div>
    </div>
  </section>

  <section class="panel">
    <p class="section-label">Summary</p>
    {#if error}
      <p class="body-copy error-copy">{error}</p>
    {:else if isLoading}
      <p class="body-copy muted">Fetching summary...</p>
    {:else if !hasFetched}
      <p class="body-copy muted">Press Start Fetching to request the summary.</p>
    {:else}
      <p class="body-copy">{summary || summaryFallback}</p>
      {#if summarySource}
        <p class="source-note muted">
          Loaded from {summarySource === 'cache' ? 'local cache' : 'network'}.
        </p>
      {/if}
    {/if}
  </section>

  <section class="panel">
    <p class="section-label">Credibility Statistics</p>
    <p class="body-copy muted">
      Placeholder for alignment score, verified-source count, and contradictory-source count.
    </p>

    <div class="placeholder-box">
      <p>3 Verified Sources Found</p>
      <p>e.g. CNA</p>
      <p class="spacer">1 Contradicting Source Found</p>
      <p>e.g. The Straits Times</p>
    </div>
  </section>

  <section class="panel">
    <p class="section-label">Website Content Comparison</p>
    <p class="body-copy muted">
      Placeholder for side-by-side comparison with a reliable source on the same topic.
    </p>
  </section>

  <div class="footer-row">
    <button class="refresh-button" on:click={loadSummary} disabled={isLoading || !currentUrl}>
      {isLoading ? 'Loading...' : 'Start Fetching'}
    </button>
  </div>
</main>

<style>
  .popup-shell {
    box-sizing: border-box;
    width: 420px;
    min-height: 640px;
    padding: 24px 22px 18px;
    background: rgba(212, 208, 202, 0.86);
  }

  .hero-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 14px;
    align-items: start;
    margin-bottom: 22px;
  }

  .url-strip,
  .panel {
    background: #f7f5f2;
    border: 1px solid rgba(79, 72, 61, 0.12);
    box-shadow: 0 2px 0 rgba(255, 255, 255, 0.35) inset;
  }

  .url-strip {
    padding: 14px 18px 16px;
  }

  .lang-chip {
    display: grid;
    place-items: center;
    background: #f7f5f2;
    border: 1px solid rgba(79, 72, 61, 0.12);
    min-height: 84px;
  }

  .lang-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 2px solid #111;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .panel {
    margin-bottom: 22px;
    padding: 20px 18px;
  }

  .section-label {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #61584b;
  }

  .url-link {
    display: block;
    overflow-wrap: anywhere;
    font-size: 15px;
    line-height: 1.5;
    text-decoration: none;
  }

  .body-copy {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
  }

  .muted {
    color: #756d61;
  }

  .error-copy {
    color: #9f1d1d;
  }

  .source-note {
    margin: 12px 0 0;
    font-size: 12px;
    letter-spacing: 0.03em;
  }

  .placeholder-box {
    margin-top: 16px;
    padding: 18px;
    background: #d4d1cc;
    color: #27231d;
  }

  .placeholder-box p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
  }

  .placeholder-box .spacer {
    margin-top: 20px;
  }

  .footer-row {
    display: flex;
    justify-content: flex-end;
  }

  .refresh-button {
    border: 1px solid #5f574d;
    background: #f7f5f2;
    color: #1b1b1b;
    padding: 9px 14px;
    border-radius: 999px;
    cursor: pointer;
  }

  .refresh-button:disabled {
    cursor: default;
    opacity: 0.6;
  }
</style>
