// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const crypto = require('crypto');

// --- APP CONFIGURATION ---
require('dotenv').config(); // Load environment variables
const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/'; // Fallback to local
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const BCRYPT_SALT_ROUNDS = 10;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- EMAIL CONFIGURATION (RESEND API - BYPASSES SMTP BLOCKS) ---
let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend Email API initialized');
} else {
  console.warn('⚠️ WARNING: RESEND_API_KEY is missing. Emails will not be sent.');
}

// --- DATABASE CONNECTION ---
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB');
    seedStockDatabase();
  })
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err);
  });


// --- DATA MODELS (SCHEMAS) ---

// 1. User Schema
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['volunteer', 'admin'], default: 'volunteer' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 2. Stock Schema (Updated)
const stockSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, trim: true }, // e.g., "Food", "Medical", "Shelter"
  units: { type: String, required: true, trim: true }, // e.g., "kg", "liters", "units", "cases"
});

const Stock = mongoose.model('Stock', stockSchema);

// 3. Record Schema
const recordSchema = new mongoose.Schema({
  // Link to the Beneficiary collection
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
  familyId: { type: String, required: true }, // Keep this for search/display
  location: { type: String, required: true },
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Record = mongoose.model('Record', recordSchema);

// 4. Beneficiary Schema (NEW)
const beneficiarySchema = new mongoose.Schema({
  familyId: { type: String, required: true, unique: true }, // eg :  "FAM-1001 or whatever"
  headOfHousehold: { type: String, required: true },
  numberOfMembers: { type: Number, required: true },
  location: { type: String, required: true },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

// 5. OTP Schema (NEW for Email Verification)
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, expires: '15m', default: Date.now }
});
const OTP = mongoose.model('OTP', otpSchema);

// --- API ROUTES (ENDPOINTS) ---

// --- Authentication Middlewares ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (token == null) return res.status(401).json({ message: 'No token provided. Unauthorized.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token. Forbidden.' });
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

app.get('/', (req, res) => res.send('AidTrack Backend is running!'));

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+{}[\]:;<>,.?~\-]/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

// --- OTP Email Verification Routes ---
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.findOneAndDelete({ email }); // Clear previous
    await OTP.create({ email, otp });

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'AidTrack <onboarding@resend.dev>', // Resend's default testing domain
        to: [email],
        subject: 'AidTrack Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
            <h2 style="color: #333;">Verify your email address</h2>
            <p style="color: #555; line-height: 1.5;">Please use the following 6-digit verification code to complete your signup process for AidTrack.</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a56db;">${otp}</span>
            </div>
            <p style="color: #777; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      if (error) {
        console.error("Resend API Error:", error);
        return res.status(500).json({ message: 'Failed to send email via Resend.', error: error.message });
      }

      console.log('Verification email sent via Resend:', data);
      res.status(200).json({ message: 'Verification code sent to your email!' });

    } else {
      // Fallback for local testing without API key: just print the code in the terminal
      console.log(`\n=== 🧪 LOCAL DEV MODE: Email Bypassed ===\nOTP Code for ${email} is: ${otp}\n=========================================\n`);
      res.status(200).json({ message: 'Verification code sent! (Check the backend server console if running locally)' });
    }
  } catch (error) {
    console.error("OTP Configure Error:", error);
    res.status(500).json({ message: 'Server error processing request.', error: error.message });
  }
});

app.post('/api/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });
    if (!record) return res.status(400).json({ message: 'Invalid or expired verification code.' });

    record.isVerified = true;
    await record.save();
    res.status(200).json({ message: 'Email successfully verified!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- User Auth Routes ---
app.post('/api/signup', async (req, res) => {
  try {
    const { fullName, email, username, password, role, adminCode } = req.body;

    // 1. Basic Validation
    if (!role || !['admin', 'volunteer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selection.' });
    }

    // 2. Admin Security Check (The Invite Code)
    if (role === 'admin') {
      const validAdminCode = process.env.ADMIN_INVITE_CODE || 'default_admin_code_2026';
      if (adminCode !== validAdminCode) {
        return res.status(403).json({ message: 'Invalid Admin Invite Code.' });
      }

      // 3. Rule: Only one admin per team (Strict limit implemented)
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 1) {
        return res.status(403).json({ message: 'An Admin already exists for this organization. Please sign up as a volunteer or contact your team.' });
      }
    }

    // 4. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists.' });
    }

    // 4.5 Check if email was verified via OTP
    const otpRecord = await OTP.findOne({ email, isVerified: true });
    if (!otpRecord) {
      return res.status(400).json({ message: 'You must verify your email address before creating an account.' });
    }

    // NEW: Password Strength Check
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ message: 'Password does not meet strength requirements. It must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.' });
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 6. Create User
    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
      role,
      isVerified: true // Automatically verified since they passed OTP
    });

    await newUser.save();

    // Clean up OTP to prevent reuse
    await OTP.findOneAndDelete({ email });

    // Since they already verified email, we can let them log in immediately.
    res.status(201).json({ message: `Account created successfully! You can now log in.`, user: { id: newUser._id, fullName: newUser.fullName, username: newUser.username, role: newUser.role } });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

    // Generate Token
    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user._id, fullName: user.fullName, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// --- NEW: Email Verification Route ---
app.get('/api/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during email verification', error });
  }
});

// PUT: /api/users/:id/profile (Update user's full name)
app.put('/api/users/:id/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName || fullName.trim() === '') {
      return res.status(400).json({ message: 'Full name cannot be empty.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { fullName: fullName.trim() },
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password from the response

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
});

// PUT: /api/users/:id/password (Change user's password)
app.put('/api/users/:id/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new passwords are required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Update the user's password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully!' });

  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: 'Server error changing password', error: error.message });
  }
});

// GET: /api/records/user/:userId (Fetch records submitted by a specific user)
app.get('/api/records/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find records where 'distributedBy' matches the user ID
    // Sort by creation date descending and limit to 10
    const userRecords = await Record.find({ distributedBy: userId })
      .sort({ createdAt: -1 }) // Sort newest first
      .limit(10) // Get the last 10 records
      .populate('beneficiary', 'familyId headOfHousehold'); // Include beneficiary info

    res.status(200).json(userRecords);

  } catch (error) {
    console.error("Error fetching user records:", error);
    res.status(500).json({ message: 'Server error fetching user records', error: error.message });
  }
});

// --- NEW: User Management Routes (for Admins) ---

// GET: /api/users (Get all users for the team page)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Send all users BUT their passwords
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// PUT: /api/users/:id/role (Update a user's role)
app.put('/api/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (role !== 'admin' && role !== 'volunteer') {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE: /api/users/:id (Deactivate/delete a user)
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// --- NEW: Beneficiary Routes ---

// POST: /api/beneficiaries (Register a new beneficiary)
app.post('/api/beneficiaries', authenticateToken, async (req, res) => {
  try {
    const { familyId, headOfHousehold, numberOfMembers, location, userId } = req.body;

    // Validation
    if (numberOfMembers <= 0) {
      return res.status(400).json({ message: 'Number of members must be greater than 0.' });
    }

    const existing = await Beneficiary.findOne({ familyId });
    if (existing) {
      return res.status(400).json({ message: 'Family ID already exists.' });
    }
    const newBeneficiary = new Beneficiary({
      familyId,
      headOfHousehold,
      numberOfMembers,
      location,
      registeredBy: userId
    });
    await newBeneficiary.save();
    res.status(201).json(newBeneficiary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// GET: /api/beneficiaries (Get all beneficiaries)
app.get('/api/beneficiaries', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const location = req.query.location || '';

    let query = {};
    if (search) {
      query.$or = [
        { familyId: { $regex: search, $options: 'i' } },
        { headOfHousehold: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (page) {
      const beneficiaries = await Beneficiary.find(query)
        .populate('registeredBy', 'username')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      const total = await Beneficiary.countDocuments(query);
      res.status(200).json({ beneficiaries, total, pages: Math.ceil(total / limit), currentPage: page });
    } else {
      const beneficiaries = await Beneficiary.find({}).populate('registeredBy', 'username').sort({ createdAt: -1 });
      res.status(200).json(beneficiaries); // Fallback for components strictly needing an array
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// PUT: /api/beneficiaries/:id (Update beneficiary)
app.put('/api/beneficiaries/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { headOfHousehold, numberOfMembers, location } = req.body;
    if (numberOfMembers <= 0) {
      return res.status(400).json({ message: 'Number of members must be greater than 0.' });
    }
    const updated = await Beneficiary.findByIdAndUpdate(
      req.params.id,
      { headOfHousehold, numberOfMembers, location },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Beneficiary not found.' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE: /api/beneficiaries/:id (Delete beneficiary)
app.delete('/api/beneficiaries/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const deleted = await Beneficiary.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Beneficiary not found.' });
    res.status(200).json({ message: 'Beneficiary deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// --- Stock Routes ---
app.get('/api/stock', authenticateToken, async (req, res) => {
  try {
    const allStock = await Stock.find({});
    res.status(200).json(allStock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stock data' });
  }
});

// POST: /api/stock/update (Adds or subtracts quantity, or adds a new item)
app.post('/api/stock/update', authenticateToken, async (req, res) => {
  try {
    // Expect category and units for new items
    const { itemName, quantity, category, units } = req.body;

    if (!itemName || quantity === undefined) { // Quantity can be 0 or negative
      return res.status(400).json({ message: 'Item name and quantity are required.' });
    }

    // Check if the item already exists
    const existingItem = await Stock.findOne({ name: itemName });

    let updatedStockItem;

    if (existingItem) {
      // Logic Check: Prevent negative stock result
      if (existingItem.quantity + quantity < 0) {
        return res.status(400).json({
          message: `Cannot update stock. Resulting quantity would be negative (Current: ${existingItem.quantity}, Requested Change: ${quantity}).`
        });
      }

      // If item exists, just update the quantity
      updatedStockItem = await Stock.findOneAndUpdate(
        { name: itemName },
        { $inc: { quantity: quantity } }, // Use $inc to add or subtract
        { new: true } // Return the updated document
      );
    } else {
      // If item is new, check if initial quantity is negative
      if (quantity < 0) {
        return res.status(400).json({ message: 'Initial quantity for a new item cannot be negative.' });
      }

      // If item is new, we NEED category and units
      if (!category || !units) {
        return res.status(400).json({ message: 'Category and units are required for new items.' });
      }
      // Create the new item (quantity can be positive or negative initially)
      const newItem = new Stock({
        name: itemName,
        quantity: quantity,
        category: category,
        units: units
      });
      updatedStockItem = await newItem.save();
    }

    res.status(200).json(updatedStockItem);
  } catch (error) {
    if (error.code === 11000) { // Handle duplicate name error cleanly
      return res.status(400).json({ message: 'Stock item name already exists.' });
    }
    console.error("Server error while updating stock:", error); // Log the error
    res.status(500).json({ message: 'Server error while updating stock', error: error.message });
  }
});

// PUT: /api/stock/:id (Update stock item details)
app.put('/api/stock/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, category, units, quantity } = req.body;
    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative.' });
    }
    const updated = await Stock.findByIdAndUpdate(
      req.params.id,
      { name, category, units, ...(quantity !== undefined && { quantity }) },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Stock item not found.' });
    res.status(200).json(updated);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Stock name already exists.' });
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE: /api/stock/:id (Delete stock item)
app.delete('/api/stock/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const deleted = await Stock.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Stock item not found.' });
    res.status(200).json({ message: 'Stock item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// --- Record Routes ---
app.get('/api/records', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query.$or = [
        { item: { $regex: search, $options: 'i' } }
      ];
    }

    // FamilyID and Location search requires population, which makes DB-side search complex
    // For simplicity, we search by item. To search by beneficiary id, we can look up matching beneficiaries first.
    if (search) {
      const matchingBeneficiaries = await Beneficiary.find({
        $or: [
          { familyId: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      if (matchingBeneficiaries.length > 0) {
        query.$or.push({ beneficiary: { $in: matchingBeneficiaries.map(b => b._id) } });
      }
    }

    if (page) {
      const records = await Record.find(query)
        .populate('distributedBy', 'fullName')
        .populate('beneficiary', 'familyId headOfHousehold location')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await Record.countDocuments(query);
      res.status(200).json({ records, total, pages: Math.ceil(total / limit), currentPage: page });
    } else {
      const allRecords = await Record.find({})
        .populate('distributedBy', 'fullName')
        .populate('beneficiary', 'familyId headOfHousehold location')
        .sort({ createdAt: -1 });
      res.status(200).json(allRecords); // Fallback
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching records', error: error.message });
  }
});

// POST: /api/records (Submit a new distribution record)
app.post('/api/records', authenticateToken, async (req, res) => {
  try {
    // Destructure potentially incoming 'category' for custom items
    let { beneficiaryId, familyId, location, item, quantity, userId, category } = req.body;

    // Basic validation
    if (!beneficiaryId || !item || !quantity || !userId) {
      return res.status(400).json({ message: 'Missing required fields for record.' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Distribution quantity must be greater than 0.' });
    }

    // Normalize item name for check
    const normalizedItemName = item.trim();

    // Check if this item exists in stock (Case Insensitive Check)
    const existingStockItem = await Stock.findOne({
      name: { $regex: new RegExp(`^${normalizedItemName}$`, 'i') }
    });

    // --- LOOPHOLE FIX: Prevent Custom Item if it exists in Stock ---
    if (category && existingStockItem) {
      return res.status(400).json({
        message: `Item "${normalizedItemName}" already exists in inventory. Please select it from the dropdown instead of adding as Custom.`
      });
    }

    // --- Stock Check Logic ---
    // If it's a standard item (no category) OR we found it matches a stock item (handled above, but safety check)
    if (!category) {
      if (!existingStockItem) {
        return res.status(404).json({ message: `Stock item "${item}" not found.` });
      }
      if (existingStockItem.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${existingStockItem.name}". Available: ${existingStockItem.quantity}, Requested: ${quantity}.`
        });
      }
      // Use the correct casing from the database
      item = existingStockItem.name;
    }
    // --- End Stock Check ---

    const newRecord = new Record({
      beneficiary: beneficiaryId,
      familyId,
      location,
      item: item, // This will be either standard name or custom name
      quantity,
      distributedBy: userId,
      // We don't store the category in the Record schema itself,
      // but you could add it if needed for reporting custom items.
    });

    // Save record ONLY if checks pass
    await newRecord.save();

    // --- Conditional Stock Update ---
    // Only update stock if it was NOT a custom item
    if (!category) {
      // Find the stock item by name and decrement its quantity.
      // Use await to ensure this completes before sending the response.
      const stockUpdateResult = await Stock.updateOne(
        { name: item }, // Match the standard item name
        { $inc: { quantity: -quantity } } // Decrement the quantity
      );

      // Optional: Check if the stock item existed and was updated
      if (stockUpdateResult.matchedCount === 0) {
        console.warn(`Warning: Stock item "${item}" not found during record submission. Quantity not updated.`);
      }
    } else {
      console.log(`Custom item "${item}" recorded. Stock not updated.`);
    }
    // --- End Conditional Stock Update ---

    res.status(201).json(newRecord); // Send back the created record

  } catch (error) {
    console.error("Error creating record:", error); // Log the detailed error
    res.status(500).json({ message: 'Server error creating record', error: error.message });
  }
});

// PUT: /api/records/:id (Update record quantity - limits item and beneficiary changes for stock integrity)
app.put('/api/records/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { quantity, location } = req.body;
    if (quantity !== undefined && quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0.' });
    }

    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });

    if (quantity !== undefined && quantity !== record.quantity) {
      const quantityDiff = quantity - record.quantity;
      const stockItem = await Stock.findOne({ name: record.item });

      if (stockItem) {
        if (quantityDiff > 0 && stockItem.quantity < quantityDiff) {
          return res.status(400).json({ message: `Insufficient stock to increase quantity. Only ${stockItem.quantity} more available.` });
        }
        await Stock.updateOne({ name: record.item }, { $inc: { quantity: -quantityDiff } });
      }
      record.quantity = quantity;
    }

    if (location !== undefined) record.location = location;

    await record.save();

    // Populate to return similar data structure as get
    await record.populate('distributedBy', 'fullName');
    await record.populate('beneficiary', 'familyId headOfHousehold');

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// DELETE: /api/records/:id (Delete record and revert stock)
app.delete('/api/records/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });

    // Attempt to revert stock
    const existingStock = await Stock.findOne({ name: record.item });
    if (existingStock) {
      await Stock.updateOne({ name: record.item }, { $inc: { quantity: record.quantity } });
    }

    await Record.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Record deleted and stock reverted (if applicable).' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});
// --- Dashboard Stats Route ---
app.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
  try {
    const familiesHelped = await Beneficiary.countDocuments(); // Now just counts beneficiaries
    const stockResult = await Stock.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]);
    const remainingStock = stockResult[0]?.total || 0;
    const volunteersActive = await User.countDocuments({ role: 'volunteer' });
    res.status(200).json({ familiesHelped, remainingStock, volunteersActive });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
});

// GET: /api/distribution-trends (Get data for the chart)
app.get('/api/distribution-trends', authenticateToken, async (req, res) => {
  try {
    // Get distributions from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trends = await Record.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo } // Filter records from the last 7 days
        }
      },
      {
        $group: {
          // Group by date (Year-Month-Day)
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          // Sum the quantity distributed on that day
          totalQuantity: { $sum: "$quantity" }
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      }
    ]);

    // Format data for Chart.js (labels and data arrays)
    const labels = trends.map(item => item._id);
    const data = trends.map(item => item.totalQuantity);

    res.status(200).json({ labels, data });

  } catch (error) {
    console.error("Error fetching distribution trends:", error);
    res.status(500).json({ message: 'Error fetching trends data', error: error.message });
  }
});

// --- START THE SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});

// --- HELPER FUNCTION TO ADD SEED DATA ---
async function seedStockDatabase() {
  const count = await Stock.countDocuments();
  if (count === 0) {
    console.log('No stock data found. Seeding database with categories and units...');
    const initialStock = [
      { name: 'Water Bottles', quantity: 250, category: 'Drinks', units: 'Case' },
      { name: 'Rice', quantity: 150, category: 'Food', units: '5kg Bag' },
      { name: 'Blanket', quantity: 300, category: 'Shelter', units: 'pcs' },
      { name: 'Medical Kit', quantity: 100, category: 'Medical', units: 'pcs' },
    ];
    await Stock.insertMany(initialStock);
    console.log('Database seeded successfully!');
  }
}