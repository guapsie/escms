document.addEventListener('DOMContentLoaded', () => {
    const btnSetup = document.getElementById('btn-setup-passkey');
    if (!btnSetup) return;

    // Inyectar animación de error (Shake)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
        }
        .shake-error { 
            animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
    `;
    document.head.appendChild(style);

    // Sintetizador Web Audio API Premium (Éxito)
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

    // Utilidades de conversión binaria a Base64URL
    const bufferToBase64url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    };

    const hexToBuffer = (hex) => {
        return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16))).buffer;
    };

    btnSetup.addEventListener('click', async () => {
        try {
            btnSetup.classList.remove('shake-error');
            btnSetup.textContent = 'Generating Passkey...';
            btnSetup.style.pointerEvents = 'none';

            // 1. Pedir Challenge al backend
            const challengeRes = await fetch('/api/challenge', { method: 'POST' });
            const { challenge } = await challengeRes.json();
            if (!challenge) throw new Error('No challenge received from server.');

            // 2. Invocar WebAuthn nativo
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: hexToBuffer(challenge),
                    rp: { name: "ESCMS", id: window.location.hostname },
                    user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "admin", displayName: "Administrator" },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: { userVerification: "discouraged", residentKey: "required" },
                    timeout: 60000,
                    attestation: "none"
                }
            });

            // 3. Extraer Clave Pública pura (sin CBOR) y empaquetar
            const pubKeyBuffer = credential.response.getPublicKey();
            if (!pubKeyBuffer) throw new Error('Authenticator does not support getPublicKey()');

            const payload = { id: credential.id, clientDataJSON: bufferToBase64url(credential.response.clientDataJSON), publicKey: bufferToBase64url(pubKeyBuffer) };
            const registerRes = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const { status, msg } = await registerRes.json();
            
            if (status !== 'success') throw new Error(msg || 'Registration failed');

            playSuccessChime();
            btnSetup.textContent = 'Verified! Loading...';
            
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            console.error('[ESCMS Auth]', err);
            btnSetup.textContent = 'Create Admin Passkey';
            btnSetup.style.pointerEvents = 'auto';
            
            // Forzar reflow para reiniciar la animación
            void btnSetup.offsetWidth;
            btnSetup.classList.add('shake-error');
        }
    });
});