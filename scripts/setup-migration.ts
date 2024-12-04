import fs from 'fs';
import path from 'path';

const MIGRATION_DIR = 'db-to-migrate';

function setupMigrationEnvironment() {
  console.log('Setting up migration environment...');

  // Create migration directory if it doesn't exist
  const migrationPath = path.join(process.cwd(), MIGRATION_DIR);
  if (!fs.existsSync(migrationPath)) {
    console.log(`Creating directory: ${migrationPath}`);
    fs.mkdirSync(migrationPath, { recursive: true });
  }

  // Check for SQLite database
  const dbPath = path.join(migrationPath, 'energy.db');
  if (!fs.existsSync(dbPath)) {
    console.log('\nSQLite database not found!');
    console.log('Please place your SQLite database file at:');
    console.log(dbPath);
    console.log('\nFile structure should be:');
    console.log(`${process.cwd()}/`);
    console.log(`└── ${MIGRATION_DIR}/`);
    console.log('    └── energy.db');
  } else {
    console.log('\nFound SQLite database at:', dbPath);
  }

  // Create .gitignore if it doesn't exist
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '');
  }

  // Add migration directory to .gitignore
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignore.includes(MIGRATION_DIR)) {
    console.log('\nAdding migration directory to .gitignore');
    fs.appendFileSync(gitignorePath, `\n${MIGRATION_DIR}/\n`);
  }

  console.log('\nSetup complete!');
}

// Run setup
setupMigrationEnvironment(); 