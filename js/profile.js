document.addEventListener('DOMContentLoaded', () => {
  const { ensureAuth, loadState, saveState, STORAGE_KEYS, formatDate, showToast } = window.brustApp;
  const user = ensureAuth();
  if (!user) return;

  const profileForm = document.getElementById('profile-form');
  const securityForm = document.getElementById('security-form');
  const avatar = document.getElementById('profile-avatar');
  const nameHeading = document.getElementById('profile-name');
  const emailHeading = document.getElementById('profile-email');
  const deviceList = document.getElementById('device-list');

  function populateProfile() {
    const walletUser = loadState(STORAGE_KEYS.user, user);
    profileForm.fullName = document.getElementById('full-name');
    profileForm.nickname = document.getElementById('nickname');
    profileForm.email = document.getElementById('account-email');
    profileForm.phone = document.getElementById('phone');
    profileForm.location = document.getElementById('location');
    profileForm.bio = document.getElementById('bio');

    profileForm.fullName.value = walletUser.name || '';
    profileForm.nickname.value = walletUser.nickname || '';
    profileForm.email.value = walletUser.email || '';
    profileForm.phone.value = walletUser.phone || '';
    profileForm.location.value = walletUser.location || '';
    profileForm.bio.value = walletUser.bio || '';

    securityForm.securityLevel = document.getElementById('security-level');
    securityForm.notifications = document.getElementById('notification-preference');
    securityForm.dailyLimit = document.getElementById('daily-limit');

    securityForm.securityLevel.value = walletUser.securityLevel || 'advance';
    securityForm.notifications.value = walletUser.notifications || 'push';
    securityForm.dailyLimit.value = walletUser.dailyLimit || 5_000_000;

    const initials = (walletUser.name || 'Brust Explorer')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    if (avatar) avatar.textContent = initials;
    if (nameHeading) nameHeading.textContent = walletUser.name || 'Brust Explorer';
    if (emailHeading) emailHeading.textContent = walletUser.email || 'explorer@brustone.id';
  }

  function renderDevices() {
    if (!deviceList) return;
    const devices = loadState(STORAGE_KEYS.devices, []);
    deviceList.innerHTML = '';
    devices.forEach((device) => {
      const card = document.createElement('div');
      card.className = 'glass-card';
      card.style.padding = '1.2rem';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem">
          <div>
            <strong>${device.name}</strong>
            <p class="text-muted" style="font-size:0.8rem">${device.location}</p>
            <p class="text-muted" style="font-size:0.75rem">Aktif ${formatDate(device.lastActive)}</p>
          </div>
          <div style="display:grid; gap:0.5rem; text-align:right">
            <span class="badge" style="justify-self:end">
              <i class="fa-solid ${device.trusted ? 'fa-lock' : 'fa-lock-open'}"></i>
              ${device.trusted ? 'Tepercaya' : 'Butuh verifikasi'}
            </span>
            <button class="btn btn-ghost" data-device="${device.id}">Cabut</button>
          </div>
        </div>
      `;
      card.querySelector('button').addEventListener('click', () => revokeDevice(device.id));
      deviceList.appendChild(card);
    });
  }

  function revokeDevice(id) {
    const devices = loadState(STORAGE_KEYS.devices, []);
    const updated = devices.filter((device) => device.id !== id);
    saveState(STORAGE_KEYS.devices, updated);
    renderDevices();
    showToast('warning', 'Perangkat dicabut', 'Perangkat tidak lagi dapat mengakses BrustOne.');
  }

  function saveProfile() {
    const walletUser = loadState(STORAGE_KEYS.user, user);
    const updatedUser = {
      ...walletUser,
      name: profileForm.fullName.value,
      nickname: profileForm.nickname.value,
      email: profileForm.email.value,
      phone: profileForm.phone.value,
      location: profileForm.location.value,
      bio: profileForm.bio.value,
      securityLevel: securityForm.securityLevel.value,
      notifications: securityForm.notifications.value,
      dailyLimit: Number(securityForm.dailyLimit.value)
    };

    saveState(STORAGE_KEYS.user, updatedUser);
    populateProfile();
    showToast('success', 'Profil tersimpan', 'Preferensi kamu telah diperbarui.');
  }

  function registerDevice() {
    const devices = loadState(STORAGE_KEYS.devices, []);
    const newDevice = {
      id: `DEV-${Math.floor(Math.random() * 9999)}`,
      name: 'Perangkat Baru',
      location: 'Indonesia',
      lastActive: Date.now(),
      trusted: false
    };
    devices.push(newDevice);
    saveState(STORAGE_KEYS.devices, devices);
    renderDevices();
    showToast('info', 'Perangkat ditambahkan', 'Verifikasi dibutuhkan sebelum perangkat bisa digunakan.');
  }

  populateProfile();
  renderDevices();

  window.saveProfile = saveProfile;
  window.registerDevice = registerDevice;
});
