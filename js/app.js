const STORAGE_KEYS = {
  user: 'brustone:user',
  wallet: 'brustone:wallet',
  rate: 'brustone:rate',
  devices: 'brustone:devices'
};

const DEFAULT_RATE = {
  brcToIdr: 15000,
  updatedAt: new Date().toISOString()
};

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TRX-89231',
    title: 'Top Up Midtrans',
    amount: 1_500_000,
    type: 'credit',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60 * 4
  },
  {
    id: 'TRX-89218',
    title: 'Bayar BrustMarket',
    amount: 480_000,
    type: 'debit',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60 * 12
  },
  {
    id: 'TRX-89190',
    title: 'Transfer ke Adit',
    amount: 250_000,
    type: 'debit',
    status: 'pending',
    timestamp: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: 'TRX-89130',
    title: 'Cashback BrustPay',
    amount: 125_000,
    type: 'credit',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60 * 36
  }
];

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse state', key, error);
    return structuredClone(fallback);
  }
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatIDR(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatBRC(value) {
  return `BRC ${Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="icon">
      <i class="${getToastIcon(type)}"></i>
    </div>
    <div class="content">
      <div class="title">${title}</div>
      <div class="message">${message}</div>
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 260);
  }, 3600);
}

function getToastIcon(type) {
  switch (type) {
    case 'success':
      return 'fa-solid fa-circle-check';
    case 'error':
      return 'fa-solid fa-circle-xmark';
    case 'warning':
      return 'fa-solid fa-triangle-exclamation';
    default:
      return 'fa-regular fa-bell';
  }
}

function ensureAuth() {
  const user = loadState(STORAGE_KEYS.user, null);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.user);
  showToast('success', 'Keluar berhasil', 'Sampai jumpa di BrustOne!');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 420);
}

async function syncRate() {
  const rate = loadState(STORAGE_KEYS.rate, DEFAULT_RATE);
  const randomShift = (Math.random() - 0.5) * 500;
  const newRate = Math.max(10_000, Math.round(rate.brcToIdr + randomShift));
  const updated = { brcToIdr: newRate, updatedAt: new Date().toISOString() };
  saveState(STORAGE_KEYS.rate, updated);
  showToast('success', 'Kurs diperbarui', `1 BrustCoin sekarang senilai ${formatIDR(newRate)}`);
  document.dispatchEvent(new CustomEvent('brust:rate-changed', { detail: updated }));
  return updated;
}

function openMidtransTopup() {
  initiateMidtransPayment({ amount: 150_000 });
}

async function initiateMidtransPayment({ amount }) {
  const clientKey = document
    .querySelector('script[src*="snap.js"]')
    ?.getAttribute('data-client-key');

  if (!clientKey || clientKey === 'MIDTRANS_CLIENT_KEY') {
    showToast('warning', 'Konfigurasi Midtrans', 'Silakan masukkan client key asli di atribut data-client-key.');
  }

  showToast('info', 'Mempersiapkan pembayaran', 'Menghubungkan ke Midtrans Snap...');

  try {
    const snapToken = await requestSnapToken(amount);
    if (window.snap && typeof window.snap.pay === 'function') {
      window.snap.pay(snapToken, {
        onSuccess: () => {
          appendTransaction({
            id: `TRX-${Math.floor(Math.random() * 1_000_000)}`,
            title: 'Top Up Midtrans',
            amount,
            type: 'credit',
            status: 'success',
            timestamp: Date.now()
          });
          showToast('success', 'Top up sukses', 'Saldo BrustCoin kamu sudah bertambah.');
        },
        onPending: () => {
          appendTransaction({
            id: `TRX-${Math.floor(Math.random() * 1_000_000)}`,
            title: 'Top Up Midtrans',
            amount,
            type: 'credit',
            status: 'pending',
            timestamp: Date.now()
          });
          showToast('warning', 'Menunggu pembayaran', 'Selesaikan pembayaran di Midtrans untuk menambah saldo.');
        },
        onError: () => {
          showToast('error', 'Top up gagal', 'Terjadi kendala saat proses Midtrans. Coba lagi.');
        },
        onClose: () => {
          showToast('warning', 'Transaksi ditutup', 'Kamu menutup jendela pembayaran sebelum selesai.');
        }
      });
    } else {
      showToast('info', 'Mode demo', 'Token Midtrans diterima. Gunakan server produksi untuk pembayaran nyata.');
    }
  } catch (error) {
    console.error(error);
    showToast('error', 'Gagal memulai Midtrans', error.message || 'Periksa koneksi server kamu.');
  }
}

async function requestSnapToken(amount) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const token = `DUMMY-SNAP-${Date.now()}-${amount}`;
  return token;
}

function appendTransaction(transaction) {
  const wallet = loadState(STORAGE_KEYS.wallet, {
    balanceBRC: 0,
    transactions: []
  });

  const rate = loadState(STORAGE_KEYS.rate, DEFAULT_RATE);
  const delta = transaction.type === 'credit' ? transaction.amount / rate.brcToIdr : -transaction.amount / rate.brcToIdr;
  wallet.balanceBRC = Math.max(0, wallet.balanceBRC + delta);
  wallet.transactions.unshift(transaction);
  saveState(STORAGE_KEYS.wallet, wallet);
  document.dispatchEvent(new CustomEvent('brust:wallet-updated', { detail: wallet }));
}

function initialiseLoginPage() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const rate = loadState(STORAGE_KEYS.rate, DEFAULT_RATE);
  const rateInfo = document.getElementById('rate-info');
  if (rateInfo) {
    rateInfo.textContent = `1 BRC ≈ ${formatIDR(rate.brcToIdr)}`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    if (password.length < 6) {
      showToast('warning', 'Kata sandi lemah', 'Gunakan minimal 6 karakter untuk keamanan.');
      return;
    }

    const nameFromEmail = email.split('@')[0].replace(/[^a-z0-9]/gi, ' ');
    const displayName = nameFromEmail
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const user = {
      email,
      name: displayName || 'Pengguna Brust',
      remember
    };

    const wallet = loadState(STORAGE_KEYS.wallet, null) || {
      balanceBRC: 128.56,
      transactions: DEFAULT_TRANSACTIONS
    };

    saveState(STORAGE_KEYS.user, user);
    saveState(STORAGE_KEYS.wallet, wallet);
    saveState(STORAGE_KEYS.rate, rate);

    showToast('success', 'Masuk berhasil', 'Selamat datang kembali di BrustOne!');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 900);
  });
}

function ensureDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.rate)) {
    saveState(STORAGE_KEYS.rate, DEFAULT_RATE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.wallet)) {
    saveState(STORAGE_KEYS.wallet, {
      balanceBRC: 128.56,
      transactions: DEFAULT_TRANSACTIONS
    });
  }
  if (!localStorage.getItem(STORAGE_KEYS.devices)) {
    const defaultDevices = [
      {
        id: 'MBP-001',
        name: 'MacBook Pro 14"',
        location: 'Jakarta, ID',
        lastActive: Date.now() - 1000 * 60 * 15,
        trusted: true
      },
      {
        id: 'IPH-892',
        name: 'iPhone 15 Pro',
        location: 'Bandung, ID',
        lastActive: Date.now() - 1000 * 60 * 60 * 5,
        trusted: true
      }
    ];
    saveState(STORAGE_KEYS.devices, defaultDevices);
  }
}

function initialiseGlobalShortcuts() {
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      showToast('info', 'Command Palette', 'Pintasan global akan segera hadir!');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ensureDefaults();
  initialiseGlobalShortcuts();
  initialiseLoginPage();
});

window.brustApp = {
  loadState,
  saveState,
  formatIDR,
  formatBRC,
  formatDate,
  syncRate,
  initiateMidtransPayment,
  appendTransaction,
  STORAGE_KEYS,
  ensureAuth,
  showToast,
  DEFAULT_RATE
};

window.showToast = showToast;
window.logout = logout;
window.syncRate = syncRate;
window.openMidtransTopup = openMidtransTopup;
window.initiateMidtransPayment = initiateMidtransPayment;
