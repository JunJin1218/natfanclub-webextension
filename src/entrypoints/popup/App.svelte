<script lang="ts">
  let currentUrl = '';
  let error = '';

  async function loadCurrentTabUrl() {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      currentUrl = tab?.url ?? 'URL을 읽지 못했습니다.';
      error = '';
    } catch (err) {
      currentUrl = '';
      error = err instanceof Error ? err.message : '알 수 없는 오류';
    }
  }

  void loadCurrentTabUrl();
</script>

<main>
  <h1>현재 탭 URL</h1>
  {#if error}
    <p class="error">{error}</p>
  {:else}
    <p class="url">{currentUrl || '불러오는 중...'}</p>
  {/if}
  <button on:click={loadCurrentTabUrl}>새로고침</button>
</main>

<style>
  main {
    width: 360px;
    padding: 16px;
    font-family: Arial, sans-serif;
  }

  h1 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  .url,
  .error {
    margin: 0 0 12px;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
    word-break: break-all;
  }

  .url {
    background: #f3f4f6;
  }

  .error {
    color: #b00020;
    background: #ffe8ee;
  }

  button {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
  }
</style>
