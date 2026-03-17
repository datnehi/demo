const form = document.getElementById('bmiForm');
const resultCard = document.getElementById('resultCard');
const bmiValue = document.getElementById('bmiValue');
const adviceLabel = document.getElementById('adviceLabel');
const adviceText = document.getElementById('adviceText');
const recommendationText = document.getElementById('recommendationText');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Không gửi được dữ liệu');
    }

    bmiValue.textContent = result.data.bmi;
    adviceLabel.textContent = 'Danh gia ket qua';
    adviceText.textContent = result.data.evaluationText || result.data.advice.note;
    recommendationText.textContent = result.data.recommendationText || '';
    resultCard.hidden = false;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    alert(error.message);
  }
});

form.addEventListener('reset', () => {
  resultCard.hidden = true;
  recommendationText.textContent = '';
});
