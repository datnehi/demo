const loginForm = document.getElementById('loginForm');
const errorText = document.getElementById('errorText');

async function checkExistingSession() {
  try {
    const response = await fetch('/api/admin/me');
    if (!response.ok) {
      return;
    }
    const result = await response.json();
    if (result.ok) {
      window.location.href = '/admin';
    }
  } catch (error) {
    // Ignore connectivity errors on initial check.
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorText.hidden = true;

  const formData = new FormData(loginForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Dang nhap that bai.');
    }

    window.location.href = '/admin';
  } catch (error) {
    errorText.textContent = error.message;
    errorText.hidden = false;
  }
});

checkExistingSession();
