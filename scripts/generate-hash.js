const bcrypt = require('bcrypt');

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node scripts/generate-hash.js <password>');
    process.exit(1);
  }

  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
