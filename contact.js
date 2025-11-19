/* FILE: contact.js */
(() => {

  
  // Elements
  const toggle = document.querySelector('.chat-toggle');
  const panel = document.querySelector('.chat-panel');
  const closeBtn = document.querySelector('.chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const body = document.querySelector('.chat-body');
  const modeSelect = document.getElementById('chat-mode');

  // Simple local FAQ dataset (you can extend)
  const FAQS = [
    { q: 'delivery time', a: 'Our usual delivery time is 1-2 business days inside Palermo. Rural deliveries may take 2-4 days.' },
    { q: 'return policy', a: 'You can return non-perishable items within 48 hours with the receipt. Open items may have different rules.' },
    { q: 'payment methods', a: 'We accept cash on delivery, paypal, bikash, and card payments.' },
    { q: 'partner', a: 'If you want to partner, please use the Partner form on our website or email partners@palme.example.' }
  ];

  const addMessage = (text, who = 'bot') => {
    const el = document.createElement('div');
    el.className = `chat-message ${who}`;
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  };

  const localAnswer = (msg) => {
    const t = msg.toLowerCase();
    // keyword match
    for (const f of FAQS) {
      if (t.includes(f.q.split(' ')[0]) || t.includes(f.q)) return f.a;
    }
    // fallback short answer
    return "Sorry, I don't know that yet — try using keywords like 'delivery', 'return', 'payment'.";
  };

  const callRemote = async (msg) => {
    // Expect a POST /api/chat that returns JSON { reply: '...' }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      return data.reply || 'No reply from server.';
    } catch (e) {
      return 'Remote chat failed: ' + e.message;
    }
  };

  const send = async () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';

    // choose mode
    if (modeSelect.value === 'local') {
      const ans = localAnswer(text);
      setTimeout(() => addMessage(ans, 'bot'), 400);
    } else {
      addMessage('Thinking...', 'bot');
      const reply = await callRemote(text);
      // remove the 'Thinking...' placeholder (last bot message)
      const last = body.querySelectorAll('.chat-message.bot');
      if (last.length) last[last.length - 1].remove();
      addMessage(reply, 'bot');
    }
  };

  // Toggle UI
  toggle.addEventListener('click', () => panel.classList.toggle('active'));
  closeBtn.addEventListener('click', () => panel.classList.remove('active'));
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  // welcome message
  setTimeout(() => addMessage('Hello! I am Palme Assistant — ask about delivery, returns, payments or type "help".', 'bot'), 600);


  // Very small example (do NOT expose your secret key in client-side code

})();
