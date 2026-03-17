const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const adminSessions = new Map();

app.use(express.json());

function parseCookies(cookieHeader = '') {
  const cookies = {};
  const parts = cookieHeader.split(';');

  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) {
      continue;
    }
    cookies[key] = decodeURIComponent(rest.join('='));
  }

  return cookies;
}

function getAdminTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies.admin_token || '';
}

function isAdminAuthenticated(req) {
  const token = getAdminTokenFromRequest(req);
  return Boolean(token) && adminSessions.has(token);
}

function requireAdminApi(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({ ok: false, message: 'Vui lòng đăng nhập admin.' });
  }
  return next();
}

function requireAdminPage(req, res, next) {
  if (!isAdminAuthenticated(req)) {
    return res.redirect('/login');
  }
  return next();
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: 'Sai tài khoản hoặc mật khẩu.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    username,
    createdAt: Date.now()
  });

  res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
  return res.json({ ok: true, message: 'Đăng nhập thành công.' });
});

app.post('/api/admin/logout', (req, res) => {
  const token = getAdminTokenFromRequest(req);
  if (token) {
    adminSessions.delete(token);
  }

  res.setHeader('Set-Cookie', 'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return res.json({ ok: true, message: 'Đã đăng xuất.' });
});

app.get('/api/admin/me', requireAdminApi, (req, res) => {
  const token = getAdminTokenFromRequest(req);
  const session = adminSessions.get(token);
  return res.json({ ok: true, data: { username: session.username } });
});

app.get('/admin', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', requireAdminPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('/api/submissions', requireAdminApi);
app.use(express.static(path.join(__dirname, 'public')));

// Demo storage: luu tam trong bo nho
const submissions = [];

function bmiAdvice(bmi) {
  if (bmi < 14) {
    return {
      label: 'Cần tăng cân',
      note: 'Bé đang có xu hướng nhẹ cân. Nên bổ sung dinh dưỡng hợp lý và theo dõi thêm.'
    };
  }
  if (bmi < 18) {
    return {
      label: 'Cân đối tốt',
      note: 'BMI của bé đang trong vùng cân đối. Tiếp tục duy trì chế độ ăn và vận động đều đặn.'
    };
  }
  if (bmi < 21) {
    return {
      label: 'Hơi cao',
      note: 'Bé có xu hướng cao hơn trung bình. Nên theo dõi khẩu phần và thói quen vận động.'
    };
  }
  return {
    label: 'Cần theo dõi',
    note: 'BMI khá cao. Nên trao đổi thêm với chuyên gia dinh dưỡng để có kế hoạch phù hợp.'
  };
}

function buildResultMessage(ageInput, weightKg, bmi) {
  const ageValue = Number(ageInput);
  const ageMonths = Number.isFinite(ageValue) && ageValue >= 0 ? Math.round(ageValue * 12) : 0;
  const weightText = Number(weightKg).toString().replace('.', ',');

  let evaluationText = `Dạ, bé ${ageMonths} tháng mà mới nặng có ${weightText} kg thì bé đang hơi thiếu cân so với tiêu chuẩn một chút, mẹ nha.`;

  if (bmi >= 18 && bmi < 21) {
    evaluationText = `Dạ, bé ${ageMonths} tháng với mức cân ${weightText} kg đang trong nhóm cân đối, mẹ tiếp tục duy trì chế độ ăn và vận động đều cho con nhé.`;
  } else if (bmi >= 21) {
    evaluationText = `Dạ, bé ${ageMonths} tháng với mức cân ${weightText} kg đang có xu hướng cao hơn chuẩn, mẹ nên theo dõi chế độ ăn và vận động cho con sát hơn ạ.`;
  }

  const recommendationText = `Với thể trạng và độ tuổi bé nhà mình, chuyên viên dinh dưỡng khuyến cáo mẹ dùng dòng Kun Doctor GrowPlus này cho con ạ — dòng này hỗ trợ kích thích con ăn ngon, tăng cường chiều cao, ổn định tiêu hóa và tăng cân hiệu quả mẹ nha.`;

  return { evaluationText, recommendationText };
}

app.post('/api/collect', async (req, res) => {
  const {
    parentName,
    relation,
    phone,
    email,
    childName,
    screenHours,
    age,
    gender,
    heightCm,
    weightKg
  } = req.body;

  if (!parentName || !phone || !childName || !age || !heightCm || !weightKg) {
    return res.status(400).json({
      ok: false,
      message: 'Vui lòng nhập đầy đủ các trường bắt buộc.'
    });
  }

  const h = Number(heightCm) / 100;
  const w = Number(weightKg);

  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Chiều cao hoặc cân nặng không hợp lệ.'
    });
  }

  const bmi = +(w / (h * h)).toFixed(1);
  const advice = bmiAdvice(bmi);
  const resultMessage = buildResultMessage(age, w, bmi);

  const record = {
    id: submissions.length + 1,
    createdAt: new Date().toISOString(),
    parent: { parentName, relation, phone, email },
    child: { childName, screenHours, age, gender, heightCm: Number(heightCm), weightKg: w },
    bmi,
    advice
  };

  submissions.push(record);

  return res.json({
    ok: true,
    data: {
      id: record.id,
      bmi: record.bmi,
      advice: record.advice,
      childName: record.child.childName,
      evaluationText: resultMessage.evaluationText,
      recommendationText: resultMessage.recommendationText
    }
  });
});

app.get('/api/submissions', (req, res) => {
  const data = [...submissions].reverse();
  res.json({ ok: true, count: data.length, data });
});

app.listen(PORT, () => {
  if (ADMIN_USERNAME === 'admin' && ADMIN_PASSWORD === 'admin123') {
    console.warn('Đang dùng tài khoản admin mặc định. Nên đổi trong file .env.');
  }
  console.log(`Server running at http://localhost:${PORT}`);
});
