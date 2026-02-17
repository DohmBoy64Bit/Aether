import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { AiEngineService } from './services/ai-engine.service.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the AI Engine Loop (default 1 minute)
  AiEngineService.start();
});
