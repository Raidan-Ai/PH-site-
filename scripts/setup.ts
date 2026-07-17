import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const generateSecret = () => crypto.randomBytes(64).toString('base64');
const generateShortSecret = () => crypto.randomBytes(32).toString('base64');

async function setup() {
  console.log('\n=================================================');
  console.log('   PressHouse Enterprise Platform - Setup Wizard');
  console.log('=================================================\n');

  const envPath = path.join(process.cwd(), '.env');
  const examplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(examplePath)) {
    console.error('Error: .env.example not found!');
    process.exit(1);
  }

  let envContent = fs.readFileSync(examplePath, 'utf8');

  console.log('Step 1: Generating secure system secrets...');
  
  const secrets = {
    JWT_SECRET: generateSecret(),
    ENCRYPTION_KEY: generateSecret(),
    SESSION_SECRET: generateSecret(),
    API_RATE_LIMIT_KEY: generateShortSecret(),
    WEBHOOK_SECRET: generateShortSecret(),
    CRON_SECRET: generateShortSecret(),
  };

  for (const [key, value] of Object.entries(secrets)) {
    envContent = envContent.replace(new RegExp(`${key}=.*`, 'g'), `${key}=${value}`);
  }
  console.log('✅ System secrets generated successfully.\n');

  console.log('Step 2: Institutional Configuration');
  const domain = await question('Enter official domain (e.g., ph-ye.org): ') || 'ph-ye.org';
  const rootEmail = await question('Enter Root Admin email (raidan@ph-ye.org): ') || 'raidan@ph-ye.org';
  const rootPass = await question('Enter Root Admin password: ');
  const defaultAdminPass = await question('Enter Default Admin password for seeding: ');

  envContent = envContent.replace(/DOMAIN=.*/g, `DOMAIN=${domain}`);
  envContent = envContent.replace(/VITE_DOMAIN=.*/g, `VITE_DOMAIN=${domain}`);
  envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=api.${domain}`);
  envContent = envContent.replace(/ROOT_ADMIN_EMAIL=.*/g, `ROOT_ADMIN_EMAIL=${rootEmail}`);
  envContent = envContent.replace(/ROOT_ADMIN_PASSWORD=.*/g, `ROOT_ADMIN_PASSWORD=${rootPass}`);
  envContent = envContent.replace(/DEFAULT_ADMIN_PASSWORD=.*/g, `DEFAULT_ADMIN_PASSWORD=${defaultAdminPass}`);

  console.log('\nStep 3: AI & Mail Configuration');
  const geminiKey = await question('Enter Gemini API Key (Optional): ');
  const smtpUser = await question('Enter SMTP User (web@ph-ye.org): ') || 'web@ph-ye.org';
  const smtpPass = await question('Enter SMTP Password: ');

  envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiKey}`);
  envContent = envContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${smtpUser}`);
  envContent = envContent.replace(/SMTP_PASSWORD=.*/g, `SMTP_PASSWORD=${smtpPass}`);
  envContent = envContent.replace(/SMTP_FROM=.*/g, `SMTP_FROM="بيت الصحافة <${smtpUser}>"`);

  fs.writeFileSync(envPath, envContent);

  console.log('\n=================================================');
  console.log('✅ Setup completed successfully!');
  console.log('Configuration saved to .env file.');
  console.log('You can now run: npm run dev');
  console.log('=================================================\n');

  rl.close();
}

setup().catch(console.error);
