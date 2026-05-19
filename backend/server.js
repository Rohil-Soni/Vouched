require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/db');
require('./src/jobs/nudge');

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Vouched API running on port ${PORT}`));
});
