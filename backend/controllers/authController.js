const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Farmer = require('../models/Farmer');
const { sendVerificationEmail } = require('../services/emailService');

function generateToken(farmerId) {
  return jwt.sign(
    { farmerId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' } // 7d se 30d kiya
  );
}

async function signup(req, res) {
  try {
    const { fullName, email, phone, state, password } = req.body;
    if (!fullName || !email || !phone || !state || !password) {
      return res.status(400).json({ message: 'Saari fields zaroori hain' });
    }
    const existingFarmer = await Farmer.findByEmail(email);
    if (existingFarmer) {
      return res.status(409).json({ message: 'Ye email already registered hai' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const farmer = await Farmer.create({ fullName, email, phone, passwordHash, state });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await Farmer.setVerificationToken(email, verificationToken);
    try {
      await sendVerificationEmail(email, fullName, verificationToken);
    } catch (emailErr) {
      console.error('Verification email error:', emailErr.message);
    }
    res.status(201).json({
      message: 'Account ban gaya. Email check karein verification ke liye.',
      requiresVerification: true,
      email: farmer.email
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup mein kuch galat ho gaya' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email aur password zaroori hain' });
    }
    const farmer = await Farmer.findByEmail(email);
    if (!farmer) {
      return res.status(401).json({ message: 'Email ya password galat hai' });
    }
    const isMatch = await bcrypt.compare(password, farmer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ya password galat hai' });
    }
    if (!farmer.is_verified) {
      return res.status(403).json({ message: 'Pehle apna email verify karein. Inbox check karein.' });
    }
    const token = generateToken(farmer.id);
    res.json({
      message: 'Login successful',
      token,
      farmer: {
        id: farmer.id,
        fullName: farmer.full_name,
        email: farmer.email,
        phone: farmer.phone,
        state: farmer.state
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login mein kuch galat ho gaya' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token missing hai' });
    const farmer = await Farmer.verifyByToken(token);
    if (!farmer) return res.status(400).json({ message: 'Token invalid ya already use ho gaya hai' });
    res.json({ message: 'Email verify ho gaya! Ab login kar sakte hain.', email: farmer.email });
  } catch (err) {
    console.error('Verify email error:', err.message);
    res.status(500).json({ message: 'Verification mein error' });
  }
}

async function getProfile(req, res) {
  try {
    const farmer = await Farmer.findById(req.farmerId);
    if (!farmer) return res.status(404).json({ message: 'Farmer nahi mila' });
    res.json({
      fullName: farmer.full_name,
      email: farmer.email,
      phone: farmer.phone,
      state: farmer.state,
      memberSince: new Date(farmer.created_at).toLocaleDateString('en-IN', {
        month: 'long', year: 'numeric'
      })
    });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ message: 'Profile fetch mein error' });
  }
}

module.exports = { signup, login, getProfile, verifyEmail };