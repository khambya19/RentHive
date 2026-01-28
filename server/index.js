require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const sequelize = require('./config/db'); 
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/reviews', reviewRoutes);


app.post('/api/users/upload-photo', upload.single('profilePic'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ photoUrl: `http://localhost:3001/uploads/${req.file.filename}` });
});

sequelize.sync({ alter: true }).then(() => {
    app.listen(5001, () => console.log(`🚀 Server running on http://localhost:3001`));
});

const PORT = process.env.PORT || 3001;

sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server actually running on http://localhost:${PORT}`);
    });
}).catch(err => console.error("Database connection failed:", err));