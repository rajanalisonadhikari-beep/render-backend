const bcrypt = require('bcrypt');

async function main() {
  const password = process.argv[2] || 'change-me-now';
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
