document.addEventListener('DOMContentLoaded', () => {
    const btnLogin = document.getElementById('btn-login-passkey');
    if (!btnLogin) return;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
        }
        .shake-error { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    `;
    document.head.appendChild(style);

    const playSuccessChime = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    };

    const bufferToBase64url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const hexToBuffer = (hex) => {
        return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer;
    };

    const base64urlToBuffer = (base64url) => {
        const padding = '='.repeat((4 - base64url.length % 4) % 4);
        const base64 = (base64url + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const buffer = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            buffer[i] = rawData.charCodeAt(i);
        }
        return buffer.buffer;
    };

    btnLogin.addEventListener('click', async () => {
        try {
            btnLogin.classList.remove('shake-error');
            btnLogin.textContent = 'Authenticating...';
            btnLogin.style.pointerEvents = 'none';

            const challengeRes = await fetch('/api/login-challenge', { method: 'POST' });
            const { challenge, allowedIds } = await challengeRes.json();
            if (!challenge) throw new Error('No challenge received.');

            const allowCredentials = (allowedIds || []).map(id => ({
                type: 'public-key',
                id: base64urlToBuffer(id),
                transports: ['internal', 'usb', 'ble', 'nfc']
            }));

            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: hexToBuffer(challenge),
                    rpId: window.location.hostname,
                    allowCredentials: allowCredentials,
                    userVerification: "discouraged",
                    timeout: 60000
                }
            });

            const payload = { id: credential.id, clientDataJSON: bufferToBase64url(credential.response.clientDataJSON), authenticatorData: bufferToBase64url(credential.response.authenticatorData), signature: bufferToBase64url(credential.response.signature) };
            const verifyRes = await fetch('/api/login-verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const { status, msg } = await verifyRes.json();
            
            if (status !== 'success') throw new Error(msg || 'Login failed');

            playSuccessChime();
            btnLogin.textContent = 'Welcome! Loading...';
            setTimeout(() => window.location.href = '/admin', 1000);
        } catch (err) {
            console.error('[ESCMS Login]', err);
            btnLogin.textContent = 'Login with Passkey';
            btnLogin.style.pointerEvents = 'auto';
            void btnLogin.offsetWidth;
            btnLogin.classList.add('shake-error');
        }
    });
});