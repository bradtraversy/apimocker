window.dataLayer = window.dataLayer || [];
window.gtag = function gtag() {
  window.dataLayer.push(arguments);
};
window.gtag('js', new Date());
window.gtag('config', 'G-BQM7V0HBFE');

const fallbackCopy = (text, focusTarget) => {
  const previousFocus = document.activeElement;
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.append(textArea);
  textArea.select();

  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy command failed');
    }
  } finally {
    textArea.remove();

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus();
    } else if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }
};

const copyText = async (text, focusTarget) => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      fallbackCopy(text, focusTarget);
      return;
    }
  }

  fallbackCopy(text, focusTarget);
};

const setupCopyButton = () => {
  const copyButton = document.querySelector('[data-copy-target]');
  const copyStatus = document.querySelector('#copy-status');

  if (!(copyButton instanceof HTMLButtonElement) || !copyStatus) {
    return;
  }

  const defaultLabel = copyButton.textContent || 'Copy';
  let resetTimer;

  copyButton.addEventListener('click', async () => {
    const targetId = copyButton.dataset.copyTarget;
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) {
      copyStatus.textContent = 'The command is unavailable to copy.';
      return;
    }

    window.clearTimeout(resetTimer);

    try {
      await copyText(target.textContent || '', copyButton);
      copyButton.textContent = 'Copied';
      copyStatus.textContent = 'API request copied to your clipboard.';
      resetTimer = window.setTimeout(() => {
        copyButton.textContent = defaultLabel;
        copyStatus.textContent = '';
      }, 3000);
    } catch {
      copyButton.textContent = defaultLabel;
      copyStatus.textContent = 'Copy failed. Select the command and copy it manually.';
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCopyButton, { once: true });
} else {
  setupCopyButton();
}
