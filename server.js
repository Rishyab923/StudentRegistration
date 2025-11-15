require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const User = require('./models/User');
const Course = require('./models/Course');
const Registration = require('./models/Registration');

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'change_this_secret',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// make flash & user available in templates
app.use((req, res, next)=>{
  res.locals.user = req.session.user || null;
  res.locals.messages = req.flash();
  next();
});

// ✅ MongoDB connection (FIXED)
mongoose.connect(
  'mongodb+srv://studentadmin:student123@cluster0.mwr9xoa.mongodb.net/StudentRegistration?retryWrites=true&w=majority&appName=Cluster0',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection failed:', err));

// ✅ Seed sample courses if none
async function seedCoursesIfEmpty() {
  const c = await Course.countDocuments();
  if (c === 0) {
    await Course.create([
      { code: 'CS101', title: 'Intro to Programming', description: 'Basics of programming', instructor: 'Dr. Sharma', seats: 50 },
      { code: 'CS102', title: 'Computer Organization', description: 'CPU, memory, instruction cycles', instructor: 'Dr. Mehta', seats: 45 },
      { code: 'CS201', title: 'Data Structures', description: 'Arrays, lists, trees', instructor: 'Prof. Reddy', seats: 40 },
      { code: 'CS202', title: 'Algorithms', description: 'Sorting, searching, optimization', instructor: 'Prof. Asha', seats: 35 },
      { code: 'CS301', title: 'Web Development', description: 'Node + Express', instructor: 'Dr. Varma', seats: 50 },
      { code: 'CS302', title: 'Database Systems', description: 'SQL, MongoDB, transactions', instructor: 'Prof. Kiran', seats: 40 },
      { code: 'CS303', title: 'Software Engineering', description: 'Design, testing, agile', instructor: 'Dr. Nandini', seats: 30 },
      { code: 'CS304', title: 'Operating Systems', description: 'Processes, threads, memory management', instructor: 'Prof. Rajesh', seats: 45 },
      { code: 'CS305', title: 'Computer Networks', description: 'TCP/IP, routing, security', instructor: 'Dr. Sneha', seats: 35 },
      { code: 'CS306', title: 'Machine Learning', description: 'Supervised and unsupervised learning', instructor: 'Dr. Deepa', seats: 40 }
    ]);
    console.log('✅ Seeded 10 sample courses with instructor names');
  }
}

seedCoursesIfEmpty().catch(()=>{});

// Middleware
function ensureAuth(req, res, next){
  if (req.session.user) return next();
  req.flash('error', 'Please login first.');
  return res.redirect('/login');
}

// Routes
app.get('/', (req, res) => res.redirect('/courses'));

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if(!user){
    req.flash('error', 'Invalid credentials');
    return res.redirect('/login');
  }
  const ok = await bcrypt.compare(password, user.password);
  if(!ok){
    req.flash('error', 'Invalid credentials');
    return res.redirect('/login');
  }
  // set session
  req.session.user = { id: user._id, name: user.name, email: user.email };
  req.flash('success', 'Logged in');
  res.redirect('/courses');
});

app.get('/signup', (req, res) => res.render('signup'));

app.post('/signup', async (req, res) => {
  try{
    const { name, email, password } = req.body;
    if(!name || !email || !password) {
      req.flash('error','All fields required');
      return res.redirect('/signup');
    }
    const existing = await User.findOne({ email });
    if(existing){
      req.flash('error','User already exists, please login');
      return res.redirect('/login');
    }
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hash });
    await user.save();
    req.flash('success','Signup successful. Please login.');
    res.redirect('/login');
  }catch(err){
    console.error(err);
    req.flash('error','Signup error');
    res.redirect('/signup');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(()=>{});
  res.redirect('/login');
});

app.get('/courses', async (req, res) => {
  const courses = await Course.find();
  let registrations = [];
  if(req.session.user){
    registrations = await Registration.find({ user: req.session.user.id }).populate('course');
  }
  res.render('courses', { courses, registrations });
});

app.get('/register/:courseId', ensureAuth, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if(!course){
    req.flash('error','Course not found');
    return res.redirect('/courses');
  }
  res.render('register', { course });
});

app.post('/register/:courseId', ensureAuth, async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if(!course){
    req.flash('error','Course not found');
    return res.redirect('/courses');
  }
  const existing = await Registration.findOne({ user: req.session.user.id, course: course._id });
  if(existing){
    req.flash('info','Already registered for this course');
    return res.redirect('/courses');
  }
  await Registration.create({ user: req.session.user.id, course: course._id });
  req.flash('success','Registered successfully');
  res.redirect('/courses');
});

// Start server
app.listen(PORT, ()=> console.log(`🚀 Server running on port ${PORT}`));
