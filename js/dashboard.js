document.addEventListener('DOMContentLoaded', () => {
  const {
    ensureAuth,
    loadState,
    STORAGE_KEYS,
    formatIDR,
    formatBRC,
    formatDate,
    showToast
  } = window.brustApp;

  const user = ensureAuth();
  if (!user) return;

  const elements = {
    name: document.getElementById('user-name'),
    greeting: document.getElementById('greeting'),
    walletBalance: document.getElementById('wallet-balance'),
    walletBalanceIdr: document.getElementById('wallet-balance-idr'),
    sidebarBalance: document.getElementById('sidebar-balance'),
    sidebarBalanceIdr: document.getElementById('sidebar-balance-idr'),
    conversionMode: document.getElementById('conversion-mode'),
    amount: document.getElementById('amount'),
    conversionResult: document.getElementById('conversion-result'),
    conversionRate: document.getElementById('conversion-rate'),
    amountLabel: document.querySelector('label[for="amount"]'),
    conversionForm: document.getElementById('conversion-form'),
    transactionsTable: document.querySelector('#transactions-table tbody'),
    midtransStatus: document.getElementById('midtrans-status')
  };

  if (elements.name) {
    elements.name.textContent = user.name || 'Explorer';
  }
  updateGreeting();

  function updateGreeting() {
    const hours = new Date().getHours();
    const message =
      hours < 12
        ? 'Selamat pagi! Cek reward BrustCoin-mu.'
        : hours < 18
        ? 'Selamat siang! Saatnya optimalkan aset BrustCoin.'
        : 'Selamat malam! Nikmati insight portofolio kamu.';
    if (elements.greeting) {
      elements.greeting.textContent = message;
    }
  }

  function renderWallet() {
    const wallet = loadState(STORAGE_KEYS.wallet, { balanceBRC: 0, transactions: [] });
    const rate = loadState(STORAGE_KEYS.rate, window.brustApp.DEFAULT_RATE || { brcToIdr: 15000 });
    const idr = wallet.balanceBRC * rate.brcToIdr;
    const formattedIdr = formatIDR(idr);
    const formattedBrc = formatBRC(wallet.balanceBRC);

    if (elements.walletBalance) elements.walletBalance.textContent = formattedBrc;
    if (elements.walletBalanceIdr) elements.walletBalanceIdr.textContent = `≈ ${formattedIdr}`;
    if (elements.sidebarBalance) elements.sidebarBalance.textContent = formattedBrc;
    if (elements.sidebarBalanceIdr) elements.sidebarBalanceIdr.textContent = `≈ ${formattedIdr}`;
  }

  function renderTransactions() {
    const wallet = loadState(STORAGE_KEYS.wallet, { transactions: [] });
    const rate = loadState(STORAGE_KEYS.rate, window.brustApp.DEFAULT_RATE || { brcToIdr: 15000 });
    if (!elements.transactionsTable) return;

    elements.transactionsTable.innerHTML = '';
    wallet.transactions.slice(0, 6).forEach((transaction) => {
      const row = document.createElement('tr');
      const brcValue = transaction.amount / rate.brcToIdr;
      row.innerHTML = `
        <td>
          <strong>${transaction.title}</strong>
          <p class="text-muted" style="font-size: 0.8rem">${transaction.id}</p>
        </td>
        <td>
          ${formatIDR(transaction.amount)}
          <p class="text-muted" style="font-size: 0.75rem">${formatBRC(brcValue)}</p>
        </td>
        <td>
          <span class="status-pill ${transaction.status}">
            <i class="${statusIcon(transaction.status)}"></i>
            ${statusLabel(transaction.status)}
          </span>
        </td>
        <td>${formatDate(transaction.timestamp)}</td>
      `;
      elements.transactionsTable.appendChild(row);
    });
  }

  function statusLabel(status) {
    switch (status) {
      case 'success':
        return 'Berhasil';
      case 'pending':
        return 'Menunggu';
      default:
        return 'Gagal';
    }
  }

  function statusIcon(status) {
    switch (status) {
      case 'success':
        return 'fa-solid fa-circle-check';
      case 'pending':
        return 'fa-solid fa-clock';
      default:
        return 'fa-solid fa-circle-exclamation';
    }
  }

  function updateConversionPreview() {
    if (!elements.amount || !elements.conversionResult) return;
    const mode = elements.conversionMode.value;
    const amountValue = Number(elements.amount.value) || 0;
    const rate = loadState(STORAGE_KEYS.rate, { brcToIdr: 15000 });

    if (mode === 'buy') {
      const brc = amountValue / rate.brcToIdr;
      elements.conversionResult.textContent = `${formatBRC(brc)}`;
      elements.conversionRate.textContent = `Rate saat ini 1 BRC = ${formatIDR(rate.brcToIdr)}`;
      elements.amountLabel.childNodes[0].textContent = 'Jumlah IDR ';
    } else {
      const idr = amountValue * rate.brcToIdr;
      elements.conversionResult.textContent = `${formatIDR(idr)}`;
      elements.conversionRate.textContent = `Menjual ${formatBRC(amountValue)} @ ${formatIDR(rate.brcToIdr)}`;
      elements.amountLabel.childNodes[0].textContent = 'Jumlah BRC ';
    }
  }

  function handleConversion(event) {
    event.preventDefault();
    const mode = elements.conversionMode.value;
    const amountValue = Number(elements.amount.value);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      showToast('warning', 'Nilai tidak valid', 'Masukkan jumlah yang lebih besar dari 0.');
      return;
    }

    const rate = loadState(STORAGE_KEYS.rate, { brcToIdr: 15000 });
    if (mode === 'buy') {
      window.brustApp.appendTransaction({
        id: `BRC-${Date.now()}`,
        title: 'Beli BrustCoin',
        amount: amountValue,
        type: 'credit',
        status: 'success',
        timestamp: Date.now()
      });
      showToast('success', 'Konversi berhasil', 'BrustCoin kamu sudah bertambah.');
    } else {
      const idr = amountValue * rate.brcToIdr;
      window.brustApp.appendTransaction({
        id: `SELL-${Date.now()}`,
        title: 'Jual BrustCoin',
        amount: idr,
        type: 'debit',
        status: 'success',
        timestamp: Date.now()
      });
      showToast('success', 'Konversi berhasil', 'Rupiah hasil penjualan sedang ditransfer.');
    }

    elements.amount.value = mode === 'buy' ? 100000 : 1;
    updateConversionPreview();
  }

  function initialiseListeners() {
    elements.conversionMode?.addEventListener('change', updateConversionPreview);
    elements.amount?.addEventListener('input', updateConversionPreview);
    elements.conversionForm?.addEventListener('submit', handleConversion);

    document.addEventListener('brust:rate-changed', updateFromEvents);
    document.addEventListener('brust:wallet-updated', updateFromEvents);
  }

  function updateFromEvents() {
    renderWallet();
    renderTransactions();
    updateConversionPreview();
  }

  function renderChart() {
    const ctx = document.getElementById('performance-chart');
    if (!ctx || !window.Chart) return;

    const labels = Array.from({ length: 30 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - index));
      return new Intl.DateTimeFormat('id-ID', { month: 'short', day: 'numeric' }).format(date);
    });

    const base = loadState(STORAGE_KEYS.rate, { brcToIdr: 15000 }).brcToIdr / 1000;
    const data = labels.map((_, idx) => base + Math.sin(idx / 2) * 2 + Math.random() * 1.5);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(127, 90, 240, 0.45)');
    gradient.addColorStop(1, 'rgba(127, 90, 240, 0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nilai BrustCoin (x1000 IDR)',
            data,
            fill: true,
            backgroundColor: gradient,
            borderColor: '#7f5af0',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            padding: 12,
            borderColor: 'rgba(127, 90, 240, 0.4)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            callbacks: {
              label: (context) => `Rp${(context.parsed.y * 1000).toLocaleString('id-ID')}`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#64748b' },
            grid: { color: 'rgba(148, 163, 184, 0.08)' }
          }
        }
      }
    });
  }

  function monitorMidtrans() {
    if (window.snap) {
      elements.midtransStatus.textContent = 'Tersambung';
      elements.midtransStatus.style.color = 'var(--success)';
    } else {
      elements.midtransStatus.textContent = 'Demo Mode';
      elements.midtransStatus.style.color = 'var(--warning)';
    }
  }

  renderWallet();
  renderTransactions();
  updateConversionPreview();
  renderChart();
  initialiseListeners();
  monitorMidtrans();
});
