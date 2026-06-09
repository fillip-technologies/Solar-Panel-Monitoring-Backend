import 'dotenv/config'

import {app} from './app.js'
import pool from './src/config/db.js'

const PORT = process.env.PORT;

app.listen(PORT || 4000, async () => {
  const client = await pool.connect();
  try {
    await client.query("SELECT NOW()");
    console.log("connected");
  } finally {
    client.release();
  }
});
