const dotenv = require('dotenv');
const { default: mongoose } = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`App running on port ${port}...`);
    });
    console.log('DB connection successful!');
  })
  .catch(() => {
    console.log('DB is not connected');
  });
const tour = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')
);

async function importData() {
  try {
    await Tour.create(tour);
    console.log('Data Successfully Uploadedd');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
}

async function deleteData() {
  try {
    await Tour.deleteMany();
    console.log('Data deleted Successfully Uploadedd');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
}

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
